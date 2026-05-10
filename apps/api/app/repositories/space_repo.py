import uuid
from typing import Optional

from sqlmodel import Session, select

from app.models.space import Space, SpaceReport


def get_space(session: Session, space_id: str) -> Optional[Space]:
    return session.exec(select(Space).where(Space.id == space_id)).first()


def create_space(session: Session, user_id: str, name: str) -> Space:
    row = Space(id=str(uuid.uuid4()), user_id=user_id, name=name)
    session.add(row)
    return row


def attach_report(session: Session, space_id: str, report_id: str) -> SpaceReport:
    row = SpaceReport(id=str(uuid.uuid4()), space_id=space_id, report_id=report_id)
    session.add(row)
    return row
