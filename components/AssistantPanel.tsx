"use client";
import React, { useRef, useState, useEffect } from "react";
import { useAssistant } from "./store";
import { readEvents } from "./stream";
import type { AssistantRequest } from "../contracts/assistant";
const cards = [
  ["summary", "▤", "Present me Summary", "Your queue, prioritised"],
  ["talk", "◉", "Talk to me", "Think through a decision"],
  ["help", "?", "Help me", "Answers from your policy"],
  ["teach", "♧", "Teach me", "Learn one step at a time"],
] as const;
export function AssistantPanel() {
  const state = useAssistant();
  const [open, setOpen] = useState(true);
  const [question, setQuestion] = useState("");
  const [sources, setSources] = useState<
    { id: string; title: string; text: string }[]
  >([]);
  const [speak, setSpeak] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const last = useRef<{
    action: AssistantRequest["action"];
    message: string;
  } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      abort.current?.abort();
    },
    [],
  );
  useEffect(() => {
    const container = bottom.current?.parentElement;
    if (container && state.messages.length)
      container.scrollTop = container.scrollHeight;
  }, [state.messages]);
  const busy = state.status !== "idle";
  async function send(action: AssistantRequest["action"], message = "") {
    if (useAssistant.getState().status !== "idle") return;
    const previous = useAssistant.getState();
    last.current = { action, message };
    setSources([]);
    const history =
      previous.action === action
        ? previous.messages
            .filter((m) => !m.degraded)
            .slice(-10)
            .map(({ role, content }) => ({ role, content }))
        : [];
    const base = [
      ...previous.messages,
      {
        role: "user" as const,
        content:
          message ||
          cards.find((c) => c[0] === action)?.[2] ||
          "Replay Greeting",
      },
    ];
    state.set({
      status: "loading",
      error: null,
      action,
      summary: null,
      messages: [...base, { role: "assistant", content: "" }],
    });
    abort.current = new AbortController();
    const timeout = setTimeout(() => abort.current?.abort(), 12000);
    const update = (content: string, degraded = false) => {
      const current = useAssistant.getState().messages;
      state.set({
        messages: [
          ...current.slice(0, -1),
          { role: "assistant", content, degraded },
        ],
      });
    };
    let answer = "";
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          message,
          history,
          language: previous.language,
        }),
        signal: abort.current.signal,
      });
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? "Rate limit reached. Please try again in a minute."
            : "Connection interrupted. Please retry.",
        );
      if (!response.body)
        throw new Error("Connection interrupted. Please retry.");
      await readEvents(response.body, (event) => {
        if (event.type === "delta") {
          answer += event.text;
          state.set({ status: "streaming" });
          update(answer);
        }
        if (event.type === "summary") state.set({ summary: event.summary });
        if (event.type === "sources") setSources(event.sources);
        if (event.type === "fallback") {
          answer = event.text;
          state.set({ summary: null });
          update(answer, true);
        }
      });
      if (speak && answer && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(answer);
        speech.lang = { English: "en-US", Hindi: "hi-IN", Spanish: "es-ES" }[
          previous.language
        ];
        window.speechSynthesis.speak(speech);
      }
    } catch (error) {
      state.set({
        error:
          error instanceof Error && error.message.startsWith("Rate limit")
            ? error.message
            : "Connection interrupted. Please retry.",
      });
    } finally {
      clearTimeout(timeout);
      state.set({ status: "idle" });
    }
  }
  if (!open)
    return (
      <button className="launcher" onClick={() => setOpen(true)}>
        ✦ Open approvals assistant
      </button>
    );
  return (
    <aside className="assistant" aria-label="Approvals assistant">
      <header className="assistant-head">
        <span className="avatar">✦</span>
        <div>
          <strong>Approvals</strong>
          <small>Your workflow assistant</small>
        </div>
        <button
          aria-label="Close assistant"
          onClick={() => {
            abort.current?.abort();
            setOpen(false);
          }}
        >
          ×
        </button>
      </header>
      <div className="assistant-nav">
        <span>⌂ &nbsp; Approvals</span>
        <button disabled={busy} onClick={() => send("greeting")}>
          Replay Greeting ↻
        </button>
      </div>
      <div className="assistant-body">
        <p className="eyebrow">A LITTLE CLARITY, WHEN YOU NEED IT</p>
        <h2>How can I help?</h2>
        <p className="muted intro">Your approvals, with a clearer next step.</p>
        <div className="action-grid">
          {cards.map(([action, icon, label, description]) => (
            <button
              key={action}
              disabled={busy}
              onClick={() => send(action)}
              className={"action-card " + action}
            >
              <span className="card-icon">{icon}</span>
              <strong>{label}</strong>
              <small>{description}</small>
            </button>
          ))}
        </div>
        <div className="preferences">
          <label>
            Language{" "}
            <select
              aria-label="Language"
              disabled={busy}
              value={state.language}
              onChange={(e) =>
                state.set({
                  language: e.target.value as AssistantRequest["language"],
                })
              }
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={speak}
              onChange={(e) => setSpeak(e.target.checked)}
            />{" "}
            Read aloud
          </label>
        </div>
        {state.messages.length > 0 && (
          <div className="conversation" role="log" aria-label="Conversation">
            {state.messages.map((m, i) => (
              <div key={i} className={"message role-" + m.role}>
                {m.role === "assistant" && (
                  <small>
                    {m.degraded
                      ? "○ Reference fallback · AI unavailable"
                      : "✦ Approvals assistant"}
                  </small>
                )}
                <p>{m.content}</p>
              </div>
            ))}
          </div>
        )}
        {state.summary && (
          <div className="summary">
            <strong>{state.summary.headline}</strong>
            <ol>
              {state.summary.items.map((i) => (
                <li key={i.id}>
                  <b>
                    {i.id} · {i.priority}
                  </b>
                  <br />
                  {i.reason}
                </li>
              ))}
            </ol>
          </div>
        )}
        {sources.length > 0 && (
          <details>
            <summary>Policy references ({sources.length})</summary>
            {sources.map((s) => (
              <p key={s.id}>
                <b>
                  [{s.id}] {s.title}
                </b>
                <br />
                {s.text}
              </p>
            ))}
          </details>
        )}
        {busy && (
          <p role="status" className="activity">
            <span className="pulse" />
            {state.status === "loading"
              ? "Connecting to assistant…"
              : "Receiving response…"}
            <button onClick={() => abort.current?.abort()}>Stop</button>
          </p>
        )}
        {state.error && (
          <div role="alert" className="error">
            {state.error}
            <button
              onClick={() => {
                if (last.current)
                  send(last.current.action, last.current.message);
              }}
            >
              Retry
            </button>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) {
            send(
              ["help", "teach"].includes(state.action) ? state.action : "talk",
              question.trim(),
            );
            setQuestion("");
          }
        }}
      >
        <input
          aria-label="Ask about approvals"
          placeholder={
            state.action === "help"
              ? "Ask a policy question…"
              : "Ask about your approvals…"
          }
          value={question}
          maxLength={2000}
          disabled={busy}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button aria-label="Send message" disabled={busy || !question.trim()}>
          ↑
        </button>
      </form>
      <footer className="assistant-footer">
        <span>
          <i /> 4 items in your queue
        </span>
        <span>Decisions stay with you</span>
      </footer>
    </aside>
  );
}
