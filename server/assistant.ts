import {
  AssistantRequest,
  StreamEvent,
  Summary,
  SummarySchema,
} from "../contracts/assistant";
import { buildPrompt } from "../prompts/approvals.v1";
import { ZodError } from "zod";
export interface Provider {
  summary(input: AssistantRequest, signal: AbortSignal): Promise<unknown>;
  stream(
    input: AssistantRequest,
    signal: AbortSignal,
    summary?: Summary,
  ): AsyncIterable<string>;
}
const fallbackText = {
  English:
    "AI is unavailable. There are 4 pending approvals. All share Sep 18; severity is unknown. Open each item, verify evidence, and record your decision manually. Safety concerns should go to the site safety lead.",
  Hindi:
    "AI अभी उपलब्ध नहीं है। 4 अनुमोदन लंबित हैं। सभी की तारीख Sep 18 है; गंभीरता अज्ञात है। प्रत्येक आइटम खोलें, साक्ष्य जाँचें और निर्णय स्वयं दर्ज करें।",
  Spanish:
    "La IA no está disponible. Hay 4 aprobaciones pendientes, todas del 18 de septiembre; la gravedad es desconocida. Revise las pruebas y registre su decisión manualmente.",
};
export async function runAssistant(
  input: AssistantRequest,
  provider: Provider,
  emit: (e: StreamEvent) => void,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
) {
  const controller = new AbortController();
  let active = true;
  const send = (e: StreamEvent) => {
    if (active) emit(e);
  };
  const sources = buildPrompt(input).sources;
  if (sources.length) send({ type: "sources", sources });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort = () => {};
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("timeout"));
    }, options.timeoutMs ?? 8000);
    onAbort = () => {
      controller.abort();
      reject(new Error("cancelled"));
    };
    if (options.signal?.aborted) onAbort();
    else options.signal?.addEventListener("abort", onAbort, { once: true });
  });
  const task = async () => {
    let summary: Summary | undefined;
    if (input.action === "summary") {
      summary = SummarySchema.parse(
        await provider.summary(input, controller.signal),
      );
      send({ type: "summary", summary });
    }
    let length = 0;
    for await (const text of provider.stream(
      input,
      controller.signal,
      summary,
    )) {
      length += text.length;
      if (length > 14000) throw new Error("oversized");
      send({ type: "delta", text });
    }
    if (!length) throw new Error("empty");
  };
  try {
    await Promise.race([task(), deadline]);
  } catch (error) {
    if (!options.signal?.aborted)
      send({
        type: "fallback",
        reason: controller.signal.aborted
          ? "timeout"
          : error instanceof ZodError
            ? "invalid_response"
            : "unavailable",
        text:
          input.action === "help"
            ? sources.length
              ? sources
                  .map((s) => `[${s.id}] ${s.title}: ${s.text}`)
                  .join("\n\n")
              : "The reference policy does not specify an answer to this question. Ask the site administrator."
            : fallbackText[input.language],
      });
  } finally {
    active = false;
    controller.abort();
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
    if (!options.signal?.aborted) emit({ type: "done" });
  }
}
