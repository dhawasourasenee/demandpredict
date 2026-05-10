from typing import Optional

from sqlmodel import Session, select

from app.models.report import Report


def create(session: Session, row: Report) -> Report:
    session.add(row)
    return row


def get_by_calculation(session: Session, calculation_id: str) -> Optional[Report]:
    return session.exec(select(Report).where(Report.calculation_id == calculation_id)).first()


def get_by_id(session: Session, report_id: str) -> Optional[Report]:
    return session.exec(select(Report).where(Report.id == report_id)).first()
