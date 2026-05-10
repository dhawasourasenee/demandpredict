# Fashion Opportunity Calculator

Frontend-first Vercel app for the AI Fashion Opportunity Calculator. The React UI lives in
`apps/web`, shared logic lives in `packages/*`, and Vercel functions under `api/` keep
AI credentials server-side while Claude reaches Apify through Anthropic's remote MCP connector.

## Prerequisites

- Node 18+ and `pnpm` (`npx pnpm@9.15.4` works if Corepack symlinks fail).
- Vercel environment variables for live AI/tool calls:
  - `ANTHROPIC_API_KEY`
  - `APIFY_TOKEN` for the Apify hosted MCP server
  - `APIFY_MCP_URL` optional, defaults to `https://mcp.apify.com/?tools=apify/instagram-hashtag-scraper,apify/google-search-scraper`
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
- **HTTPS flow**: the SPA sends planner JSON via **HTTPS POST** to `/api/calculations`. The Vercel function holds `ANTHROPIC_API_KEY` / `APIFY_TOKEN`, invokes **Claude** with Anthropic's remote MCP connector, and Claude connects to the **Apify hosted MCP server**. The app no longer calls Apify actors directly. Do **not** call Anthropic or Apify from the browser with API keys.
- If `ANTHROPIC_API_KEY` is missing, the calculator uses heuristic analysis.
- If `APIFY_TOKEN` is missing, the calculator uses heuristic analysis instead of attempting MCP tool calls.

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
