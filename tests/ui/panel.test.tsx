import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AssistantPanel } from "../../components/AssistantPanel";
import { useAssistant } from "../../components/store";
beforeEach(() => useAssistant.getState().reset());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test("shows loading while request is pending", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );
  render(<AssistantPanel />);
  fireEvent.click(screen.getByRole("button", { name: /Present me Summary/i }));
  expect(await screen.findByRole("status")).toHaveTextContent("Connecting");
});
test("renders provider tokens before stream completes", async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const enc = new TextEncoder();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(c) {
          controller = c;
        },
      }),
    }),
  );
  render(<AssistantPanel />);
  fireEvent.click(screen.getByRole("button", { name: /Present me Summary/i }));
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  controller.enqueue(
    enc.encode('data: {"type":"delta","text":"First token"}\n\n'),
  );
  expect(await screen.findByText("First token")).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Receiving");
  controller.enqueue(enc.encode('data: {"type":"done"}\n\n'));
  controller.close();
  await waitFor(() =>
    expect(screen.queryByRole("status")).not.toBeInTheDocument(),
  );
});
test("shows a recoverable network error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
  render(<AssistantPanel />);
  fireEvent.click(screen.getByRole("button", { name: /Present me Summary/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Connection interrupted",
  );
  expect(screen.getByRole("button", { name: /Retry/i })).toBeEnabled();
});
test("replaces partial text with a marked fallback", async () => {
  const enc = new TextEncoder();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(c) {
          c.enqueue(
            enc.encode(
              'data: {"type":"delta","text":"Unfinished AI claim"}\n\ndata: {"type":"fallback","reason":"timeout","text":"Verified local queue fallback"}\n\ndata: {"type":"done"}\n\n',
            ),
          );
          c.close();
        },
      }),
    }),
  );
  render(<AssistantPanel />);
  fireEvent.click(screen.getByRole("button", { name: /Present me Summary/i }));
  expect(
    await screen.findByText("Verified local queue fallback"),
  ).toBeVisible();
  expect(screen.queryByText("Unfinished AI claim")).not.toBeInTheDocument();
  expect(screen.getByText(/Reference fallback/)).toBeVisible();
});
