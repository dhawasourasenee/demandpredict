"""
Vercel serverless entry: URL /api/analyze → this function receives path / only.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Vercel may not put the repo root on sys.path; `from api.*` fails without this.
_repo_root = Path(__file__).resolve().parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api._env import load_local_env
from api.analysis import run_analysis
from api.schemas import AnalyzeRequest, AnalyzeResponse

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

app = FastAPI(title="Fashion Opportunity Intelligence — analyze", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    return await run_analysis(req)
