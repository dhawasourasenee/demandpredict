from __future__ import annotations

from fastapi import HTTPException

from api.calculations import apply_final_calculations
from api.openai_client import call_openai_vision
from api.schemas import AnalyzeRequest, AnalyzeResponse


async def run_analysis(req: AnalyzeRequest) -> AnalyzeResponse:
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
