import { z } from "zod";
export const Action = z.enum(["summary", "talk", "help", "teach", "greeting"]);
export const RequestSchema = z
  .object({
    action: Action,
    language: z.enum(["English", "Hindi", "Spanish"]).default("English"),
    message: z.string().trim().max(2000).default(""),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().max(8000),
        }),
      )
      .max(12)
      .default([]),
  })
  .strict();
export const SummarySchema = z
  .object({
    headline: z.string().min(1).max(400),
    items: z
      .array(
        z
          .object({
            id: z.enum(["patrol", "drone", "safety", "spatial"]),
            priority: z.enum(["high", "medium", "low"]),
            reason: z.string().min(1).max(800),
          })
          .strict(),
      )
      .length(4),
  })
  .strict()
  .refine(
    (s) => new Set(s.items.map((i) => i.id)).size === 4,
    "Each queue item must appear exactly once",
  );
export const EventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("delta"), text: z.string().max(16000) }),
  z.object({ type: z.literal("summary"), summary: SummarySchema }),
  z.object({
    type: z.literal("sources"),
    sources: z.array(
      z.object({ id: z.string(), title: z.string(), text: z.string() }),
    ),
  }),
  z.object({
    type: z.literal("fallback"),
    text: z.string(),
    reason: z.enum(["timeout", "unavailable", "invalid_response"]),
  }),
  z.object({ type: z.literal("done") }),
]);
export type AssistantRequest = z.infer<typeof RequestSchema>;
export type StreamEvent = z.infer<typeof EventSchema>;
export type Summary = z.infer<typeof SummarySchema>;
