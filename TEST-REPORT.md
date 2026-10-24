# Local verification report

Verified on 24 October 2026, Windows, Node.js 25.2.1 and npm 11.19.0. Source and tests are included so results can be reproduced. No Anthropic API key was available.

| Check | Result |
|---|---|
| Jest unit + Supertest integration | 16 tests passed across 3 suites |
| Vitest + Testing Library + SSE parser | 6 tests passed across 2 files |
| Playwright against production server | 3 tests passed using Microsoft Edge |
| Total automated tests | 25 passed |
| TypeScript strict check | Passed |
| Production server compilation + Next.js build | Passed |
| Prettier check | Passed |
| npm audit | 0 known vulnerabilities |
| GET /api/health | 200, aiConfigured false |
| Live Claude generation | Not verified; requires candidate API key |
| Remote GitHub publication | Not performed |

## What the tests verify

Backend tests check validated structured summaries, rejection of empty/duplicate item lists, mocked Claude tool arguments, SDK token forwarding and history, stalled summary and stalled streaming deadlines, malformed HTTP requests, session cookie issuance, rate limits, policy retrieval, partial-stream failures, and grounded policy fallback. Provider errors are not exposed to the client.

Frontend tests observe loading while a request is pending, token rendering while the stream remains open, retryable network errors, replacement of partial AI text by a labelled fallback, split SSE frames with split UTF-8 bytes, and rejection of incomplete streams.

Browser checks exercise search, all five action entry points over the actual Express transport without credentials, close/reopen, fallback rendering, and mobile viewport fit. They were rerun against the production build at localhost:3001. Desktop and mobile screenshots were inspected during development; screenshots and temporary test artifacts are excluded from source control.

## Actual failing-test evidence

The default Help retrieval regression was executed before its fix. Jest reported:

```text
FAIL tests/server/grounding.test.ts
default Help me loads operational policy instead of an empty RAG surface
Expected: > 0
Received:   0
Test Suites: 1 failed, 1 passed
Tests:       1 failed, 13 passed
```

The failing test was committed separately. The fix provides a default operational query when Help is clicked without a typed question. Subsequent runs passed. The initial test commit is a review snapshot, not evidence that the entire project was executed in a strict red/green sequence; the initial tests were first run once dependencies and implementation were available.

## Issues found and resolved

- Updated vulnerable Vitest tooling; the final dependency audit is clean.
- Default Help had no query, producing no retrieved policy; added a tested default query.
- A message CSS class collided with the fixed assistant panel class; renamed message role classes after browser testing exposed blocked controls.
- Replaced page-level scrollIntoView with scrolling inside the chat body and prevented fixed panel controls from shrinking.
- Scoped browser error assertions to the assistant, excluding Next.js's unrelated framework announcement element.
- Replaced the tsx development runner with compiled TypeScript after this sandbox's user-info restriction prevented tsx startup. Both dev and production use the compiled Express server.
- Removed an empty CSS import warning and set explicit Next.js workspace roots.

## Limits of the evidence

Mocked SDK/handler tests prove application behavior, not the model's factual correctness. No live model quality, multilingual generation quality, speech synthesis voices, provider billing, model availability for your account, or real-network latency was measured. The live-key checklist in REQUIREMENTS.md is required before claiming an end-to-end AI demonstration. Prompt grounding is an instruction boundary, not a guarantee of citation correctness. The app does not execute real approvals.

Vitest may emit a harmless Node module-type warning when loading its TypeScript configuration natively. It does not affect the test results. Production build and strict type checking completed successfully.
