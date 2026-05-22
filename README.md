# AI Transformation Readiness Engine

Evidence-gated assessment scanner for AI-driven value creation readiness. React + TypeScript + Vite frontend; Gemini, Anthropic, and OpenAI providers are proxied through serverless functions under `api/`.

## Local Development

The client calls `/api/generate`, `/api/anthropic-generate`, and `/api/openai-generate`, so local development needs the serverless functions running too. Use `vercel dev` when testing live assessment runs:

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

## Golden Fixtures

Synthetic AI transformation documents are bundled for drift checks:

| Fixture | Profile | Expected stage |
| --- | --- | --- |
| `golden-emerging.txt` | AI tool adoption without readiness | Emerging |
| `golden-structured.txt` | Structured but fragmented AI transformation | Structured |
| `golden-adaptive.txt` | Adaptive AI value-creation capability | Adaptive / Value-creating |

The file names intentionally remain stable for compatibility with the inherited drift tooling.

## Deployment

Set environment variables in the hosting platform:

- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `SECRET_KEY`
- `VITE_AI_TACTICS_URL` optional public tactics URL

Build command: `npm run build`. Output: `dist/`.
