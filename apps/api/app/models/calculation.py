from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Calculation(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: Optional[str] = Field(default=None, foreign_key="user.id", index=True)
    input_json: str
    status: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
