import base64
import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlmodel import Session

from app.database import get_session
from app.repositories import report_repo
from app.services.pdf_service import build_pdf_placeholder

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{report_id}")
def get_report(report_id: str, session: Session = Depends(get_session)):
    row = report_repo.get_by_id(session, report_id)
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    try:
        payload = json.loads(row.report_json)
    except json.JSONDecodeError as exc:
        logger.error("bad_report_json id=%s err=%s", report_id, exc)
        raise HTTPException(status_code=500, detail="Corrupt report payload") from exc
    return JSONResponse(content=payload)


@router.post("/{report_id}/export-pdf")
def export_pdf(report_id: str) -> dict[str, str]:
    data = build_pdf_placeholder(report_id)
    b64 = base64.b64encode(data).decode("ascii")
    return {
        "report_id": report_id,
        "filename": f"opportunity-report-{report_id}.pdf",
        "content_base64": b64,
        "note": "Placeholder PDF bytes; replace with fully styled export in Phase 5.",
    }
