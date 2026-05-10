from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.calculations import apply_final_calculations
from api.openai_client import call_openai_vision
from api.schemas import AnalyzeRequest, AnalyzeResponse

_root = Path(__file__).resolve().parent.parent
load_dotenv(_root / ".env")
load_dotenv(_root / ".env.local")

_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_extra = [
    o.strip()
    for o in (os.environ.get("CORS_ORIGINS") or "").split(",")
    if o.strip()
]

app = FastAPI(title="Fashion Opportunity Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    try:
        report = await call_openai_vision(req.image_base64, req.image_mime, req.context)
        report = apply_final_calculations(report, req.context)
        return AnalyzeResponse(report=report)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
