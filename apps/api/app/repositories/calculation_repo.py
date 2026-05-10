from datetime import datetime

from typing import Optional

from sqlmodel import Session, select

from app.models.calculation import Calculation


def create(session: Session, row: Calculation) -> Calculation:
    session.add(row)
    return row


def get(session: Session, calculation_id: str) -> Optional[Calculation]:
    return session.exec(select(Calculation).where(Calculation.id == calculation_id)).first()


def mark_done(session: Session, calculation_id: str) -> None:
    row = get(session, calculation_id)
    if not row:
        return
    row.status = "complete"
    row.updated_at = datetime.utcnow()
    session.add(row)


def mark_failed(session: Session, calculation_id: str, message: str) -> None:
    row = get(session, calculation_id)
    if not row:
        return
    row.status = "failed"
    row.updated_at = datetime.utcnow()
    session.add(row)
