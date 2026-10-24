import express from "express";
import { randomUUID } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { RequestSchema, EventSchema } from "../contracts/assistant";
import { Provider, runAssistant } from "./assistant";
import { createProvider } from "./provider";
export function createApi(
  options: { provider?: Provider; timeoutMs?: number; limit?: number } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use("/api", express.json({ limit: "32kb" }));
  // Server issues session IDs; no client-supplied arbitrary header can bypass the limiter.
  const sessions = new Map<string, number>();
  app.use("/api/assistant", (req, res, next) => {
    const now = Date.now();
    for (const [id, expiry] of sessions) if (expiry < now) sessions.delete(id);
    const cookie = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("cb_session="))
      ?.slice(11);
    let id = cookie && sessions.has(cookie) ? cookie : undefined;
    if (!id) {
      id = randomUUID();
      if (sessions.size > 10000) sessions.delete(sessions.keys().next().value!);
      sessions.set(id, now + 3600000);
      res.cookie("cb_session", id, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
      });
    }
    res.locals.session = id;
    next();
  });
  // IP limiter also bounds repeated cookie resets. Both stores are local-process only.
  app.use(
    "/api/assistant",
    rateLimit({
      windowMs: 60000,
      limit: 60,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Try again in a minute." },
    }),
  );
  app.use(
    "/api/assistant",
    rateLimit({
      windowMs: 60000,
      limit: options.limit ?? 10,
      keyGenerator: (_req, res) => res.locals.session,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Session limit reached. Try again in a minute." },
    }),
  );
  app.post("/api/assistant", async (req, res) => {
    const parsed = RequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      });
      return;
    }
    res.set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    const abort = new AbortController();
    res.on("close", () => abort.abort());
    await runAssistant(
      parsed.data,
      options.provider ?? createProvider(),
      (e) => {
        if (!res.destroyed)
          res.write(`data: ${JSON.stringify(EventSchema.parse(e))}\n\n`);
      },
      { timeoutMs: options.timeoutMs, signal: abort.signal },
    );
    res.end();
  });
  app.get("/api/health", (_req, res) =>
    res.json({
      status: "ok",
      aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    }),
  );
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (res.headersSent) {
        next(error);
        return;
      }
      res.status(400).json({ error: "Request body is invalid or too large." });
    },
  );
  return app;
}
