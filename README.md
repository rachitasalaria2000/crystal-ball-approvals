# Crystal Ball approvals assistant

A working implementation of the OomniEye approvals assistant assessment: React with Next.js App Router, Express on Node.js, strict TypeScript, Zustand, Zod, and server-side Claude. Five actions use the AI provider: summary, conversation, policy help, guided teaching, and regenerated greeting. The queue fixture contains the four supplied items exactly.

## Run locally

Use Node.js 24 LTS (minimum 22.18), npm, and an Anthropic API account. Node 25.2.1 was used for this local verification. From this folder:

```powershell
npm ci
Copy-Item .env.example .env
# Edit .env locally: set ANTHROPIC_API_KEY to your own key.
npm run dev
```

Open http://localhost:3000. Without a key, the UI intentionally shows a labelled reference fallback; that is not a successful live AI response. Never put a key in a NEXT_PUBLIC variable or commit .env. Environment values load from .env, not .env.local. Restart the server after editing them. The default model is claude-sonnet-4-6; ANTHROPIC_MODEL can override it.

### Exactly what goes in .env

Create `.env` in the project root, next to `package.json`. Copy `.env.example`, then replace only the API-key placeholder below with your own Anthropic API key:

```dotenv
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
ANTHROPIC_MODEL=claude-sonnet-4-6
PORT=3000
```

`ANTHROPIC_API_KEY` is an Anthropic developer API key, not your GitHub password, Gmail password, or ChatGPT subscription. Obtain it from your own account at https://console.anthropic.com/ and enter it locally; do not paste it into chat or send it to HR. The account needs API access and any required credits. `ANTHROPIC_MODEL` chooses the model and normally stays as shown. `PORT` is the local web-server port; change it only if 3000 is already in use. No MongoDB URL, GitHub token, Gmail credentials, or other variables are needed to run this app.

GitHub should contain `.env.example` with an empty key, plus this README. Your actual `.env` is ignored by Git and stays on your computer. HR can copy the example and use their own key. With an empty key, they can still run the app and observe the labelled fallback behavior. After editing `.env`, stop the server and run `npm run dev` again.

```powershell
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build through the same Express server as the API. Do not use `next dev` or `next start` directly: those commands omit the Express API. After backend edits, restart `npm run dev`; Next.js refreshes frontend edits automatically.

For browser checks, run the app in a second terminal **without an API key**, then `npm run test:e2e`. The included Playwright configuration uses installed Microsoft Edge. For another OS, remove `channel: "msedge"` and run `npx playwright install chromium` before testing. E2E tests explicitly exercise the no-key failure path; they are not live model evaluations.

## Requirement coverage

See [REQUIREMENTS.md](REQUIREMENTS.md) for the assignment mapping, assumptions, and review checklist; [TEST-REPORT.md](TEST-REPORT.md) for verified checks and limits; and [INTERVIEW-NOTES.md](INTERVIEW-NOTES.md) for an explanation you can rehearse.

## Architecture and API

```text
React / Next.js → Zustand session state → POST /api/assistant
  → Zod request validation → per-session + per-IP limits
  → versioned prompt + queue + retrieved policy
  → Claude SDK, server only → Zod SSE events → React
```

`contracts/assistant.ts` defines requests, summary output, and every SSE event. POST JSON accepts `action` (summary/talk/help/teach/greeting), `message` (up to 2000 characters), `language` (English/Hindi/Spanish), and up to twelve role/content history messages. The client sends up to ten prior messages. Invalid input returns JSON 400; throttling returns JSON 429 with rate-limit headers. AI failure is SSE 200 with an explicit fallback event and a done event. `GET /api/health` reports status and whether a key exists, never the key.

Events use `data: {JSON}\n\n`: `sources`, `summary`, `delta`, `fallback`, `done`. Both server and client validate event schemas. Summary generation uses a forced Claude tool with a JSON schema; Zod checks exact IDs, uniqueness, count, priority values, and bounded text. Only then is the summary sent to the UI. A second genuine Claude request narrates the validated summary with provider text deltas. Other actions stream provider text deltas directly. The entire operation, including both summary calls, shares one 8000 ms wall-clock deadline; SDK retries are disabled. There may be a short validation wait before summary narration begins. No artificial token replay is used.

The 200–400 word policy is authored in `data/policy.ts`, split into five chunks. Keyword-overlap retrieval selects up to three excerpts with stable citation IDs; the UI exposes the source text. Unrelated queries retrieve no chunks. Help prompts restrict answers to those excerpts. Retrieval is intentionally English keyword based: multilingual generation is supported, but multilingual retrieval quality is a documented limitation. Prompt instructions reduce hallucination risk; they do not mathematically guarantee semantic grounding.

History lives in browser memory via Zustand; it resets on reload. It is bounded before being sent. No permanent history or external database is needed for the supplied fixture. Session throttling uses a server-issued HttpOnly, SameSite cookie, ten requests per minute, plus sixty per IP to bound cookie resets. Stores are process-local and not suitable for multiple instances. Client disconnects cancel generation. React renders text without raw HTML. Read aloud uses optional browser speech synthesis and depends on installed voices.

## AI judgment and fallback design

AI is useful for a queue summary that explains uncertainty, free-form follow-up questions, policy-grounded answers, and teaching that adapts to an operator’s experience. Each benefits from interpreting language rather than matching a fixed menu. The summary reasons over metadata only: it cannot inspect a PDF, video, or image that was never supplied. Its suggested urgency is provisional, not an operational fact.

Greeting generation is not inherently AI-necessary; a count-based template would normally be cheaper and more predictable. This assessment explicitly requests regeneration through the model, so that action also calls Claude. Counting items, filtering the table, choosing a selected row, checking schemas, limiting traffic, and recording a real approval do not need AI. This demo leaves approval execution to the operator’s actual system.

Every operation has an eight-second deadline and cancels provider work on expiry or disconnect. A failed, empty, malformed, or stalled response produces a labelled fallback. The client replaces partial AI text with deterministic queue guidance; policy help returns retrieved excerpts and citations instead of invented advice. Network failures remain visible and retryable. With more time, I would add a small multilingual grounding evaluation set and measure citation correctness and latency before changing the retrieval method or model.

## Assumptions and limitations

- No urgency, due date, year, or source-file content was supplied. The app does not fabricate them. Title-based prioritisation must identify uncertainty.
- JSON fixtures and in-memory retrieval are explicitly allowed. No MongoDB or vector database was added.
- The reference panel structure is reproduced with header/avatar, four cards, replay control, and close/reopen. CSS icons replace the reference’s illustrated character assets; this is structural rather than pixel-exact fidelity.
- No deployment is required. Express is a custom Next server; use a Node host rather than a serverless-only Next deployment.
- Real reviewer authentication, durable audit storage, multi-instance throttling, model moderation/evaluations, and actual approval mutation are outside this assessment scope.
- Missing-key fallbacks were browser-tested; live Claude quality, account permissions, billing, and latency still require your key. The two-call summary may exceed eight seconds on a slow provider and will correctly fall back.

## Test-first evidence and AI tool disclosure

Codex assisted with assignment analysis, code, test drafting, debugging, and documentation. Review and understand the implementation before presenting it in your interview. No claim is made that this was independently authored without AI.

The first local commit separates contracts and initial tests from implementation, but the initial tests were first executed after dependency installation and implementation files existed in the working tree. It is a review snapshot, not proof of strict test-first execution for the whole project. The later default-Help regression was actually run failing (zero retrieved chunks), committed as a test, then fixed and rerun passing. Do not present the initial snapshot as stronger evidence than it is. See TEST-REPORT.md for the recorded failure.

## Submission

Repository: https://github.com/rachitasalaria2000/crystal-ball-approvals

The repository is private. Invite the HR/reviewer's GitHub account under Settings → Collaborators before sharing the link. No submission message has been sent. Source files were uploaded through GitHub's browser interface because this computer's Git credential store was unavailable. The original local commit history is preserved in `git-history.bundle`; run `git clone git-history.bundle crystal-ball-with-history` to review it. Browser upload commits represent publication, not test-first development evidence.

For later local pushes after configuring Git authentication:

```powershell
git branch -M main
git remote add origin https://github.com/rachitasalaria2000/crystal-ball-approvals.git
git push -u origin main
```

Confirm `.env` is ignored, run the live-key checklist in REQUIREMENTS.md, and send your repository URL with this README through the original assignment channel. A video is optional.

## Framework references

- [Next.js installation and runtime requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Claude streaming SDK behavior](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [Claude model IDs and versioning](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions)
