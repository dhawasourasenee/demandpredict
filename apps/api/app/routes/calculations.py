import logging

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.config import Settings, get_settings
from app.database import get_session
from app.repositories import calculation_repo
from app.schemas.calculation import (
    CalculationCreateResponse,
    CalculationInputBody,
    CalculationStatusResponse,
)
from app.services.opportunity_engine import run_calculation

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/calculations", tags=["calculations"])


@router.post("", response_model=CalculationCreateResponse)
async def create_calculation(
    body: CalculationInputBody,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> CalculationCreateResponse:
    calc_id, report_id = await run_calculation(session, body, settings)
    return CalculationCreateResponse(
        calculation_id=calc_id,
        report_id=report_id,
        status="complete",
    )


@router.get("/{calculation_id}", response_model=CalculationStatusResponse)
def get_calculation(
    calculation_id: str,
    session: Session = Depends(get_session),
) -> CalculationStatusResponse:
    row = calculation_repo.get(session, calculation_id)
    if not row:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Calculation not found")
    return CalculationStatusResponse(
        id=row.id,
        status=row.status,
        created_at=row.created_at.isoformat() if row.created_at else None,
    )
