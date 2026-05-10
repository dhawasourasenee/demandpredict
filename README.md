# Fashion Opportunity Calculator

Frontend-first Vercel app for the AI Fashion Opportunity Calculator. The React UI lives in
`apps/web`, shared logic lives in `packages/*`, and Vercel functions under `api/` keep
AI credentials server-side; the calculation API calls **Claude** (Anthropic Messages API) only—no remote MCP / Apify tooling in this path.

## Prerequisites

- Node 18+ and `pnpm` (`npx pnpm@9.15.4` works if Corepack symlinks fail).
- Vercel environment variables for calculations:
  - `ANTHROPIC_API_KEY` (required for Claude)
  - `CLAUDE_MODEL` optional, defaults to `claude-sonnet-4-6`

## Install

```bash
pnpm install
```

## Develop

Run the Vercel functions and Vite app together:

```bash
pnpm dev:vercel
pnpm --filter @foc/web dev
```

- Web: http://localhost:5173
- API functions: same-origin `/api/*` in production; Vite proxies `/api/*` to Vercel dev locally.
- **HTTPS flow**: the SPA sends planner JSON via **HTTPS POST** to `/api/calculations`. The Vercel function holds `ANTHROPIC_API_KEY` and calls **Claude** on the server. Do **not** put API keys in the browser bundle.
- If `ANTHROPIC_API_KEY` is missing, the calculator falls back to heuristic analysis.

## Build

```bash
pnpm --filter @foc/web build
```

## Deploy On Vercel

This repo includes `vercel.json` at the repository root so Vercel builds the Vite app and serves the
SPA with client-side routing. API routes in `api/` run as Vercel functions and keep AI keys server-side.

1. In the Vercel project, set **Root Directory** to the repo root (leave blank / `.`), not `apps/web`.
2. Configure the environment variables listed above for Production and Preview.
3. Do not expose `ANTHROPIC_API_KEY` through `VITE_*`; browser-visible env vars are public.
