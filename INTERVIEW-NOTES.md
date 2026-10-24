# Interview preparation

## A concise introduction

“I built the approvals panel with React and Next.js, backed by an Express API in strict TypeScript. The five actions share a validated streaming contract. Claude runs only on the server. Help retrieves a few policy excerpts, and summaries use validated tool output. I treated failures as normal application states: an eight-second deadline, a labelled local fallback, and retryable network errors.”

## Explain the important choices

**Why Express and Next.js together?** Next.js handles rendering and React assets; Express gives the AI endpoint a directly testable HTTP surface with Supertest. A single custom server avoids cross-origin configuration. It adds a server build step and means deployment needs a Node process.

**Why Zustand?** The panel has shared conversation, loading, language, action, error, and structured-summary state. Zustand avoids passing those through a component tree. History is intentionally volatile and bounded, so a refresh clears it.

**How is RAG implemented?** A small, authored policy has five chunks with stable IDs. Keyword overlap ranks up to three excerpts. Only those excerpts are supplied for Help, and the UI shows them for checking. This is sufficient for the tiny English reference surface; multilingual retrieval and measured semantic grounding would need further work.

**How does streaming work?** The SDK emits text deltas; Express serializes each as an SSE event. Fetch reads the response stream, and a buffered parser handles split frames and split UTF-8 bytes. Zustand updates the current assistant message as deltas arrive. A done event is mandatory, so a dropped stream is an error rather than a silent success.

**How can a summary be structured and streamed?** The first call uses a tool schema. Zod checks all four known IDs appear exactly once with permitted priority values. A second call narrates that validated data through real provider deltas. This costs another request and increases latency, but keeps malformed partial JSON out of the UI. Both share an eight-second deadline.

**What happens if AI fails halfway?** The server emits a fallback event and then done. The client replaces the partial model answer with clearly marked deterministic guidance. Policy fallback returns actual retrieved excerpts. A disconnected browser aborts generation. A network error displays Retry.

**What did the tests catch?** An empty default Help question retrieved no policy chunks. The regression test failed with expected greater than zero, received zero. The fix supplies a default operational retrieval query. Browser screenshot review also revealed that scrollIntoView could scroll the fixed panel itself; scrolling only the body keeps its header and input visible.

**What would you improve?** A small model-quality evaluation set, multilingual retrieval, real identity and role checks, durable audit events, distributed rate-limit storage, and latency measurements. Do not describe these as already implemented.

## Demonstration order

1. Show the exact queue and search it.
2. Generate a summary, explain the provisional urgency and validation boundary.
3. Ask a conversation follow-up, then demonstrate adaptive teaching.
4. Ask Help about sensor calibration and compare the answer to [P2].
5. Regenerate a greeting and change language.
6. Remove or invalidate the key and restart to show graceful fallback.
7. Run tests and point to the failing-test/fix commits.

Disclose Codex assistance and explain the code in your own words. Be clear that the initial test snapshot is not proof of strict test-first execution for every feature, and that a live provider run requires your credentials.
