import Anthropic from "@anthropic-ai/sdk";
import { AssistantRequest, Summary } from "../contracts/assistant";
import {
  buildPrompt,
  summaryInstruction,
  narrationInstruction,
} from "../prompts/approvals.v1";
import type { Provider } from "./assistant";
export function createProvider(): Provider {
  const client = () =>
    new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 0,
      timeout: 8000,
    });
  const model = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  return {
    async summary(input: AssistantRequest, signal: AbortSignal) {
      const result = await client().messages.create(
        {
          model: model(),
          max_tokens: 1000,
          system: buildPrompt(input).system,
          messages: [{ role: "user", content: summaryInstruction }],
          tools: [
            {
              name: "submit_summary",
              description: "Submit a structured queue summary.",
              input_schema: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          enum: ["patrol", "drone", "safety", "spatial"],
                        },
                        priority: {
                          type: "string",
                          enum: ["high", "medium", "low"],
                        },
                        reason: { type: "string" },
                      },
                      required: ["id", "priority", "reason"],
                      additionalProperties: false,
                    },
                    minItems: 4,
                    maxItems: 4,
                  },
                },
                required: ["headline", "items"],
                additionalProperties: false,
              },
            },
          ],
          tool_choice: { type: "tool", name: "submit_summary" },
        },
        { signal },
      );
      const block = result.content.find((c) => c.type === "tool_use");
      return block?.type === "tool_use" ? block.input : null;
    },
    async *stream(
      input: AssistantRequest,
      signal: AbortSignal,
      summary?: Summary,
    ) {
      const prompt = buildPrompt(input);
      const content = summary
        ? narrationInstruction + JSON.stringify(summary)
        : input.message ||
          {
            talk: "Which queue items should I review first and why?",
            help: "How do I review an approval?",
            teach: "Teach me how to review my first approval.",
            greeting: "Greet me using the current queue context.",
            summary: "Summarise the queue.",
          }[input.action];
      const stream = client().messages.stream(
        {
          model: model(),
          max_tokens: 1200,
          system: prompt.system,
          messages: [...input.history, { role: "user", content }],
        },
        { signal },
      );
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          )
            yield event.delta.text;
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "max_tokens") throw new Error("truncated");
      } finally {
        stream.abort();
      }
    },
  };
}
