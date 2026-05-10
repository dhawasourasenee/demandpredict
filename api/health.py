"""
Vercel serverless entry for /api/health. Register "/" and "/api/health" for path quirks.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

_repo_root = Path(__file__).resolve().parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api._env import load_local_env

load_local_env(_repo_root)

_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_extra = [
    o.strip()
    for o in (os.environ.get("CORS_ORIGINS") or "").split(",")
    if o.strip()
]

app = FastAPI(title="Fashion Opportunity Intelligence — health", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
