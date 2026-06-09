# AI Transformation Readiness Engine

Evidence-gated assessment scanner for AI-driven value creation readiness. React + TypeScript + Vite frontend; Anthropic and OpenAI providers are proxied through serverless functions under `api/`.

## Local Development

The client calls `/api/anthropic-generate` and `/api/openai-generate`, so local development needs the serverless functions running too. Use `vercel dev` when testing live assessment runs:

```bash
npm install
cp .env.example .env.local
npx vercel dev
```

`npm run dev` still works for UI-only work, but assessment runs need the API functions.

## Product Thesis

AI readiness is not technical readiness. AI readiness is the organization ability to sense, decide, design, deliver, govern, learn, and scale AI-enabled value creation safely.

The engine assesses five readiness domains:

| Batch | Domain |
| --- | --- |
| A | Adaptive Operating Model |
| B | Enterprise AI Architecture & Platform Readiness |
| C | AI Strategy, Governance & Value Realization |
| D | Data Foundations, Ownership & Accessibility |
| E | Business Capability & Service Architecture |

The scanner keeps the proven evidence-gated architecture: dual-stream scoring, independent evidence verification, deterministic metrics, confidence-gated synthesis, fact-checking, sanitation, quality gate, and GO/WARN/BLOCK-style output.

## Knowledge Base

The remote Vercel Blob knowledge base is a simple set of PDF documents. The default folder prefix is `Knowledge Base/`; set `AI_KB_BLOB_PREFIX=__ROOT__` when PDFs live at Blob root. The PDFs do not need canonical criterion filenames or JSON front matter. If a PDF includes structured metadata, the loader will use it; otherwise the document is indexed as a general AI Transformation reference and made available as confidential rubric/context material only. Generated reports must not cite KB document names, filenames, source labels, companies, or organizations.

## Deployment

Set environment variables in the hosting platform:

- `ANTHROPIC_API_KEY`
- `GPT_API_KEY` (or `OPENAI_API_KEY` as a fallback alias)
- `SECRET_KEY`
- `BLOB_READ_WRITE_TOKEN` for the AI Transformation Vercel Blob store
- `AI_KB_BLOB_PREFIX=Knowledge Base/` optional; this is the default prefix. Use `__ROOT__` for root-level PDFs.
- `VITE_AI_TACTICS_URL` optional public tactics JSON URL

`BLOB_READ_WRITE_TOKEN` selects the Blob store, so the AI Transformation Engine can safely use the same folder name as another app if the token points to a different store. The PDF knowledge base is loaded by `/api/kb-index`; when it cannot be reached, the app falls back to the built-in JSON knowledge base.

Build command: `npm run build`. Output: `dist/`.
