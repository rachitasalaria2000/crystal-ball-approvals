# Assignment analysis and acceptance checklist

The attached assignment is the product specification. Its instructions to send a submission or create a remote repository were treated as deliverable requirements to document, not permission to message anyone or publish in an account.

| Assignment point | Implementation | Verification |
|---|---|---|
| React + Next.js | App Router app, React client components | Production build and browser tests |
| Reference assistant structure | Header/avatar, four cards, replay greeting, close/reopen | Desktop/mobile browser review |
| Present me Summary | Claude tool JSON, Zod validation, streamed narration | Jest handler + SDK mock + Supertest |
| Talk to me | Bounded multi-turn history with streaming | SDK history test, component streaming test |
| Help me | Five authored policy chunks, keyword retrieval, source IDs | Retrieval and fallback tests |
| Teach me | Versioned adaptive step-by-step prompt with history | API wiring checked; live teaching quality pending key |
| Replay Greeting | Fresh server-side generation with current queue | No-key browser action checked; live variance pending key |
| Exact supplied queue | data/queue.json | Four rows and search browser checks |
| Operator language, text/audio | English/Hindi/Spanish selector, optional browser speech | UTF-8 transport tested; voice availability browser-dependent |
| Loading/error states | Connecting/receiving status, fallback label, retry, stop | Testing Library |
| Streaming | Actual SDK deltas over SSE, validated SSE parser | Component, parser and SDK tests |
| Zustand or React Query | Zustand conversation/session store | Components use shared store |
| Node + Express + strict TS | server/*.ts, strict tsconfig | tsc and production build |
| Contract before route | contracts/assistant.ts in initial review snapshot | Zod rejects malformed request and summary |
| Server-only Claude | Anthropic SDK in server/provider.ts | Mock SDK tests; no browser key |
| Structured summary | Forced tool schema then strict Zod checks | Wrong shape and duplicate IDs rejected |
| Versioned prompts | prompts/approvals.v1.ts | Prompt and grounding tests |
| 8-second timeout | Shared abortable operation deadline | Stalled summary and stalled iterator tests |
| Graceful failure | Explicit fallback event, partial output replaced | Supertest + UI tests + browser with no key |
| Per-session throttle | Issued cookie, 10/min + IP guard 60/min | Supertest 429 |
| Jest unit test, mocked AI | Handler + SDK mock suites | npm run test:server |
| Supertest success/fallback | Express API suite | Success, timeout, invalid request, 429 |
| Vitest + Testing Library | Loading, streaming, error, fallback | npm run test:ui |
| Test-first evidence | Actual red/green Help regression; initial snapshots disclosed | TEST-REPORT.md |
| README setup | Local dev/production commands, env example | Production run verified locally |
| 150–250 word AI judgment | README AI judgment section | Included |
| AI assistance disclosure | README test-first/disclosure section | Included |
| GitHub repository | Local Git repository ready to push | Remote publication remains with candidate |
| Hosted link / walkthrough | Optional | Not created |

## Questions resolved as explicit assumptions

1. “Prioritised by urgency” conflicts with a fixture that supplies no urgency or deadlines. Keep the metadata intact and require title-based inference to be labelled; do not invent an urgent incident.
2. “Structured JSON before the UI” and “token-by-token” create a validation boundary: incomplete JSON cannot yet pass the full summary schema. Validate summary first, then stream a separate genuine LLM narration, within the same eight seconds.
3. “MERN” in the title does not require adding MongoDB: the detailed requirements explicitly allow a seed fixture and no real backend integration.
4. The embedded screenshot is the structural guide. Character artwork was not supplied as reusable separate assets; simple icons stand in for it.
5. The date is kept as Sep 18 with no invented year. Counting pending items uses the fixture, not a pretend live backend.

## Live-key acceptance checks still required

Set ANTHROPIC_API_KEY in .env, restart, then verify each action produces a fresh answer. Check a Hindi and Spanish answer; inspect provisional summary reasons; ask a second conversational question and a teaching follow-up; ask a calibration policy question and verify its [P2] citation against the visible excerpt. Ask a question absent from policy and confirm it declines to invent a rule. Confirm token arrival in DevTools and both summary calls fit the deadline in ordinary use. Test an invalid key and a slow connection. Never put your key in a screenshot or submission.
