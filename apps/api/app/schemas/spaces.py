from pydantic import BaseModel, Field


class SpaceCreateBody(BaseModel):
    user_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1, max_length=200)


class SpaceCreatedResponse(BaseModel):
    space_id: str


class AttachReportBody(BaseModel):
    report_id: str = Field(..., min_length=1)
