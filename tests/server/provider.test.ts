import { createProvider } from "../../server/provider";
import { RequestSchema } from "../../contracts/assistant";
const create = jest.fn();
const stream = jest.fn();
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: (...args: unknown[]) => create(...args),
      stream: (...args: unknown[]) => stream(...args),
    },
  })),
}));
beforeEach(() => {
  jest.clearAllMocks();
});
test("Claude tool schema and server-side abort signal are supplied", async () => {
  create.mockResolvedValue({
    content: [{ type: "tool_use", input: { headline: "example" } }],
  });
  const signal = new AbortController().signal;
  await expect(
    createProvider().summary(
      RequestSchema.parse({ action: "summary" }),
      signal,
    ),
  ).resolves.toEqual({ headline: "example" });
  expect(create.mock.calls[0][0].tool_choice).toEqual({
    type: "tool",
    name: "submit_summary",
  });
  expect(create.mock.calls[0][1]).toEqual({ signal });
});
test("SDK deltas stream unchanged and preserve multi-turn context", async () => {
  const abort = jest.fn();
  stream.mockReturnValue({
    async *[Symbol.asyncIterator]() {
      yield {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "Hello" },
      };
      yield {
        type: "content_block_delta",
        delta: { type: "text_delta", text: " there" },
      };
    },
    finalMessage: async () => ({ stop_reason: "end_turn" }),
    abort,
  });
  const result = [];
  for await (const text of createProvider().stream(
    RequestSchema.parse({
      action: "talk",
      message: "Why?",
      history: [
        { role: "user", content: "What is pending?" },
        { role: "assistant", content: "Four items." },
      ],
    }),
    new AbortController().signal,
  )) {
    result.push(text);
  }
  expect(result).toEqual(["Hello", " there"]);
  expect(stream.mock.calls[0][0].messages).toHaveLength(3);
  expect(abort).toHaveBeenCalled();
});
