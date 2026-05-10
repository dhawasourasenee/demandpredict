import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.repositories import report_repo, space_repo
from app.schemas.spaces import AttachReportBody, SpaceCreateBody, SpaceCreatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/spaces", tags=["spaces"])


@router.post("", response_model=SpaceCreatedResponse)
def create_space(body: SpaceCreateBody, session: Session = Depends(get_session)) -> SpaceCreatedResponse:
    row = space_repo.create_space(session, body.user_id, body.name)
    session.commit()
    logger.info("space_created id=%s", row.id)
    return SpaceCreatedResponse(space_id=row.id)


@router.post("/{space_id}/reports")
def attach_report(
    space_id: str,
    body: AttachReportBody,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    if not space_repo.get_space(session, space_id):
        raise HTTPException(status_code=404, detail="Space not found")
    rep = report_repo.get_by_id(session, body.report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    space_repo.attach_report(session, space_id, body.report_id)
    session.commit()
    return {"status": "saved", "space_id": space_id, "report_id": body.report_id}
