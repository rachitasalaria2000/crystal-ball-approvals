import request from "supertest";
import { createApi } from "../../server/api";
import { runAssistant, Provider } from "../../server/assistant";
import { RequestSchema, StreamEvent } from "../../contracts/assistant";
const input = RequestSchema.parse({ action: "summary" });
const good = {
  headline: "Four pending items",
  items: ["safety", "patrol", "drone", "spatial"].map((id) => ({
    id,
    priority: "medium",
    reason: "Review required; risk inferred from title.",
  })),
};
function provider(overrides: Partial<Provider> = {}): Provider {
  return {
    summary: jest.fn().mockResolvedValue(good),
    async *stream() {
      yield "Four ";
      yield "pending items.";
    },
    ...overrides,
  };
}
async function collect(p: Provider, timeoutMs = 100) {
  const events: StreamEvent[] = [];
  await runAssistant(input, p, (e) => events.push(e), { timeoutMs });
  return events;
}
test("validates summary before narrating with mocked LLM", async () => {
  const events = await collect(provider());
  expect(events[0].type).toBe("summary");
  expect(events.filter((e) => e.type === "delta")).toHaveLength(2);
  expect(events.at(-1)?.type).toBe("done");
});
test("rejects invalid AI shape and does not expose it", async () => {
  const p = provider({
    summary: jest.fn().mockResolvedValue({ headline: "invalid", items: [] }),
  });
  const events = await collect(p);
  expect(events.some((e) => e.type === "summary")).toBe(false);
  expect(events).toContainEqual(
    expect.objectContaining({ type: "fallback", reason: "invalid_response" }),
  );
});
test("rejects duplicate item IDs", async () => {
  const events = await collect(
    provider({
      summary: jest
        .fn()
        .mockResolvedValue({ ...good, items: Array(4).fill(good.items[0]) }),
    }),
  );
  expect(events[0].type).toBe("fallback");
});
test("bounds a stalled provider by deadline", async () => {
  const events = await collect(
    provider({ summary: () => new Promise(() => {}) }),
    15,
  );
  expect(events[0]).toMatchObject({ type: "fallback", reason: "timeout" });
});
test("integration streams success", async () => {
  const res = await request(createApi({ provider: provider() }))
    .post("/api/assistant")
    .send(input);
  expect(res.status).toBe(200);
  expect(res.headers["content-type"]).toContain("text/event-stream");
  expect(res.text).toContain('"type":"summary"');
  expect(res.text).toContain('"type":"delta"');
});
test("integration timeout returns graceful fallback, not 500", async () => {
  const res = await request(
    createApi({
      provider: provider({ summary: () => new Promise(() => {}) }),
      timeoutMs: 10,
    }),
  )
    .post("/api/assistant")
    .send(input);
  expect(res.status).toBe(200);
  expect(res.text).toContain('"reason":"timeout"');
  expect(res.text).toContain('"type":"done"');
});
test("invalid requests never invoke AI", async () => {
  const p = provider();
  const res = await request(createApi({ provider: p }))
    .post("/api/assistant")
    .send({ action: "delete" });
  expect(res.status).toBe(400);
  expect(p.summary).not.toHaveBeenCalled();
});
test("session cookie is issued and session throttling works", async () => {
  const agent = request.agent(createApi({ provider: provider(), limit: 1 }));
  const first = await agent.post("/api/assistant").send(input);
  expect(first.headers["set-cookie"]).toBeDefined();
  const second = await agent.post("/api/assistant").send(input);
  expect(second.status).toBe(429);
});
