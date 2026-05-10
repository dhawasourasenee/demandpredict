from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class BusinessContext(BaseModel):
    market: str
    target_customer: str
    region: str
    season: str
    average_selling_price: float = Field(ge=0)
    planned_assortment_mix_percent: float = Field(ge=0, le=100)
    planned_units: int = Field(ge=0)
    expected_sell_through_percent: float = Field(ge=0, le=100)


class AnalyzeRequest(BaseModel):
    image_base64: str
    image_mime: str = "image/jpeg"
    context: BusinessContext


class AnalyzeResponse(BaseModel):
    report: dict[str, Any]
