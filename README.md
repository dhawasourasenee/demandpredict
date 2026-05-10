# Fashion Opportunity Calculator

Monorepo for the AI Fashion Opportunity Calculator described in `PRD`: Turborepo, `pnpm` workspaces (`apps/web`, `packages/*`), and a FastAPI backend under `apps/api`.

## Prerequisites

- Node 18+ and `pnpm` (`npx pnpm@9.15.4` works if Corepack symlinks fail).
- Python 3.9+ with a virtualenv for the API (`apps/api/.venv`).
- Copy `.env.example` to `.env` and configure `DATABASE_URL`, `ANTHROPIC_API_KEY`, and `APIFY_TOKEN` as needed.

## Install

```bash
pnpm install
cd apps/api && python3 -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]"
```

## Develop

Runs the Vite frontend and Uvicorn API together:

```bash
pnpm dev
```

- Web: http://localhost:5173 — API defaults to http://127.0.0.1:8000 (`VITE_API_URL`).
- Health: GET http://127.0.0.1:8000/health

## Test (API)

```bash
cd apps/api && . .venv/bin/activate && PYTHONPATH=. pytest
```

## Deploy on Vercel (frontend)

This repo includes `vercel.json` at the **repository root** so Vercel builds the Vite app with pnpm + Turborepo and serves the SPA with client-side routing.

1. In the Vercel project, set **Root Directory** to the repo root (leave blank / `.`), not `apps/web`.
2. **Environment variables** (Production and Preview as needed):
   - `VITE_API_URL` — full origin of your FastAPI deployment, e.g. `https://api.yourdomain.com` (no trailing slash). Vite bakes this in at build time.
3. On the API host, set **`CORS_ORIGINS`** (or extend the default origins in settings) so it includes your Vercel URLs, e.g. `https://<project>.vercel.app` and your custom domain.

Important: **`apps/api`** is a long‑running FastAPI app with SQLite by default. Vercel is ideal here for the **static web UI**. Host the Python API on a container or PaaS (Fly.io, Railway, Render, etc.), point `DATABASE_URL` at **Postgres** (e.g. Supabase), then aim `VITE_API_URL` at that API. Optionally you can explore [FastAPI on Vercel Functions](https://vercel.com/docs/frameworks/backend/fastapi) (`tool.vercel.entrypoint`), but you still need an external database and cold‑start/function limits apply.
