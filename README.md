# Fashion Opportunity Calculator

Frontend-first Vercel app for the AI Fashion Opportunity Calculator. The React UI lives in
`apps/web`, shared logic lives in `packages/*`, and the secure Anthropic/Apify calls run in
Vercel functions under `api/` using Vercel environment variables.

## Prerequisites

- Node 18+ and `pnpm` (`npx pnpm@9.15.4` works if Corepack symlinks fail).
- Vercel environment variables for live AI/tool calls:
  - `ANTHROPIC_API_KEY`
  - `APIFY_TOKEN`
  - `CLAUDE_MODEL` optional, defaults to `claude-sonnet-4-6`
  - `AGENT_MAX_ITERATIONS` optional, defaults to `6`
  - `APIFY_ACTOR_INSTAGRAM` optional, defaults to `apify/instagram-hashtag-scraper`
  - `APIFY_ACTOR_WEB` optional, defaults to `apify/google-search-scraper`

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
- If `ANTHROPIC_API_KEY` is missing, the calculator uses heuristic analysis.
- If `APIFY_TOKEN` is missing, Claude tool calls receive mock trend signals.

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
