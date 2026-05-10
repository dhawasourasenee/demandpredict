from datetime import datetime

from sqlmodel import Field, SQLModel


class Space(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SpaceReport(SQLModel, table=True):
    id: str = Field(primary_key=True)
    space_id: str = Field(foreign_key="space.id", index=True)
    report_id: str = Field(foreign_key="report.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
