from sqlmodel import Session

from app.models.evidence import EvidenceSource


def add(session: Session, row: EvidenceSource) -> EvidenceSource:
    session.add(row)
    return row
