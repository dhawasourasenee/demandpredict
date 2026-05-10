from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class EvidenceSource(SQLModel, table=True):
    id: str = Field(primary_key=True)
    calculation_id: str = Field(foreign_key="calculation.id", index=True)
    source_type: str
    title: str
    url: str
    snippet: str
    published_at: Optional[datetime] = None
    relevance_score: float = 0.0
    raw_json: str = "{}"
    created_at: datetime = Field(default_factory=datetime.utcnow)
