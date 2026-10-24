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

See [REQUIREMENTS.md](REQUIREMENTS.md) for the assignment mapping, assumptions, and review checklist, and [TEST-REPORT.md](TEST-REPORT.md) for verified checks and limits.

## Framework references

- [Next.js installation and runtime requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Claude streaming SDK behavior](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [Claude model IDs and versioning](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions)
