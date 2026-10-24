import { test, expect } from "vitest";
import { readEvents } from "../../components/stream";
import type { StreamEvent } from "../../contracts/assistant";
test("SSE parser handles fragmented UTF-8 and multiple frames", async () => {
  const bytes = new TextEncoder().encode(
    'data: {"type":"delta","text":"नमस्ते"}\n\ndata: {"type":"done"}\n\n',
  );
  const events: StreamEvent[] = [];
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const b of bytes) c.enqueue(Uint8Array.of(b));
      c.close();
    },
  });
  await readEvents(body, (e) => events.push(e));
  expect(events).toEqual([{ type: "delta", text: "नमस्ते" }, { type: "done" }]);
});
test("truncated SSE is a recoverable error rather than silent completion", async () => {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      c.close();
    },
  });
  await expect(readEvents(body, () => {})).rejects.toThrow("Incomplete stream");
});
