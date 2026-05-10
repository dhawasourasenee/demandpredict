"""
Vercel serverless entry: URL /api/health → this function receives path / only.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

_repo_root = Path(__file__).resolve().parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(_repo_root / ".env")
load_dotenv(_repo_root / ".env.local")

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
async def health() -> dict[str, str]:
    return {"status": "ok"}
