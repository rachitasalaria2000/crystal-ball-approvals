import { EventSchema, StreamEvent } from "../contracts/assistant";
export async function readEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: StreamEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneEvent = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      if (buffer.length > 100000) throw new Error("Oversized response");
      let end: number;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (frame.startsWith("data: ")) {
          const event = EventSchema.parse(JSON.parse(frame.slice(6)));
          onEvent(event);
          if (event.type === "done") doneEvent = true;
        }
      }
      if (done) break;
    }
    if (!doneEvent) throw new Error("Incomplete stream");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
