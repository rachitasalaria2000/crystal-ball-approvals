import { buildPrompt } from "../../prompts/approvals.v1";
import { RequestSchema, StreamEvent } from "../../contracts/assistant";
import { runAssistant, Provider } from "../../server/assistant";
import { retrieve } from "../../server/retrieval";
test("default Help me loads operational policy instead of an empty RAG surface", () => {
  expect(
    buildPrompt(RequestSchema.parse({ action: "help" })).sources.length,
  ).toBeGreaterThan(0);
});
test("retrieval selects calibration policy and keeps stable citation IDs", () => {
  expect(retrieve("sensor calibration maintenance")[0].id).toBe("P2");
});
test("unrelated questions have no fabricated retrieval match", () => {
  expect(retrieve("quantum entanglement")).toHaveLength(0);
});
test("partial model output is replaced by a visibly marked fallback", async () => {
  const events: StreamEvent[] = [];
  const p: Provider = {
    async summary() {
      return null;
    },
    async *stream() {
      yield "partial";
      throw new Error("secret-provider-details");
    },
  };
  await runAssistant(RequestSchema.parse({ action: "talk" }), p, (e) =>
    events.push(e),
  );
  expect(events.map((e) => e.type)).toEqual(["delta", "fallback", "done"]);
  expect(JSON.stringify(events)).not.toContain("secret-provider-details");
});
test("help fallback returns retrieved reference text and citations", async () => {
  const events: StreamEvent[] = [];
  const p: Provider = {
    async summary() {
      throw new Error("down");
    },
    async *stream() {
      throw new Error("down");
      yield "";
    },
  };
  await runAssistant(
    RequestSchema.parse({ action: "help", message: "sensor calibration" }),
    p,
    (e) => events.push(e),
  );
  expect(events.find((e) => e.type === "fallback")).toMatchObject({
    text: expect.stringContaining("[P2]"),
  });
});
test("a stalled streaming iterator is also bounded", async () => {
  const events: StreamEvent[] = [];
  const p: Provider = {
    async summary() {
      return null;
    },
    async *stream() {
      await new Promise(() => {});
      yield "";
    },
  };
  await runAssistant(
    RequestSchema.parse({ action: "talk" }),
    p,
    (e) => events.push(e),
    { timeoutMs: 10 },
  );
  expect(events[0]).toMatchObject({ type: "fallback", reason: "timeout" });
});
