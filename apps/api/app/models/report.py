from datetime import datetime

from sqlmodel import Field, SQLModel


class Report(SQLModel, table=True):
    id: str = Field(primary_key=True)
    calculation_id: str = Field(foreign_key="calculation.id", index=True, unique=True)
    report_json: str
    confidence_level: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
