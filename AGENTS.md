# AGENTS.md

## Cursor Cloud specific instructions

### What this app is
Single product: the **AI Transformation Readiness Engine** — a Vite + React + TypeScript
single-page app (`src/`) whose LLM calls are proxied through Vercel-style serverless
functions (`api/*.js`). Locally/on Railway those same handlers are hosted by
`server.js` (Express). See `README.md` and `package.json` scripts for the canonical
commands; only the non-obvious caveats are captured below.

### Services and how to run them (development)
Two processes are needed for a full local dev setup:

- **API host** — `node server.js` (defaults to port `3000`). Mounts every `api/*.js`
  handler at `/api/<name>` and serves `dist/` for a production-style run.
- **Frontend** — `npm run dev` (Vite on port `5173`). Vite proxies `/api/*` to
  `http://localhost:3000` (see `vite.config.ts`), so run `server.js` alongside it.

Then open `http://localhost:5173/`.

Other standard commands (see `package.json`): `npm run build` (`tsc && vite build`,
outputs `dist/`), `npm run preview`, `npm start` (production Express run of `dist/`).
There is no ESLint config; "lint" is the TypeScript typecheck, i.e. `npx tsc --noEmit`
(also run as the first half of `npm run build`).

### Non-obvious gotchas
- **`server.js` does NOT load `.env` / `.env.local`.** It only reads `process.env`.
  When running `node server.js` directly you must pass env vars inline, e.g.
  `SECRET_KEY=dev-secret-key node server.js`. (`.env.local` is only auto-loaded by
  `npx vercel dev`, the alternative dev path in `README.md`.) `.env.local` is
  gitignored; copy `.env.example` as a starting point.
- **Auth = single shared secret.** `SECRET_KEY` doubles as the login password AND the
  HMAC signing key for the session cookie (`lib/auth.js`). The whole UI is gated: click
  the padlock in the header and enter the `SECRET_KEY` value to unlock. Without
  `SECRET_KEY` set on the API host, `/api/login` returns 500 and you cannot unlock.
- **Live assessments need paid LLM keys.** Running an actual assessment calls
  `/api/anthropic-generate` and/or `/api/openai-generate`, which require
  `ANTHROPIC_API_KEY` and/or `GPT_API_KEY` (`OPENAI_API_KEY` is an accepted alias).
  Login, the criteria/reference views, and importing/rendering a previously exported
  report (HTML/JSON) all work WITHOUT any LLM keys.
- **Knowledge base is optional.** `/api/kb-index` reads a Vercel Blob store via
  `BLOB_READ_WRITE_TOKEN`; when absent it cleanly falls back to the built-in JSON KB.

### Node version caveat for test scripts (important)
Tests are the `test:*` scripts in `package.json` (plain `node scripts/test-*.mjs`,
no test runner). Four of them import `.ts` files directly and therefore require a Node
version with default TypeScript type-stripping (**Node >= 22.18**). The default
`node` on PATH here is `/exec-daemon/node` (v22.14), which is too old and makes those
four fail with `ERR_UNKNOWN_FILE_EXTENSION ".ts"`. A suitable Node is preinstalled via
nvm (`v22.22.2`); run the tests with it on PATH, e.g.:

```
PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" npm run test:model-routing
```

Affected scripts: `test:model-routing`, `test:image-normalization`,
`test:source-registry`, `test:dlp-sampling`.

- **Known pre-existing test failures (not environment issues):**
  `test:antipattern-semantics`, `test:domain-diagnosis`, and `test:tactic-grounding`
  fail on assertion mismatches even on Node 22.22.2. These are logic assertions in the
  repo, unrelated to setup — do not treat them as broken environment. The other 17
  `test:*` scripts pass on Node >= 22.18.
