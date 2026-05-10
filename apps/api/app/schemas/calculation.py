from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CalculationType(str, Enum):
    forecast = "forecast"
    hindsight = "hindsight"


class Market(str, Enum):
    women = "women"
    men = "men"


class Department(str, Enum):
    apparel = "apparel"
    footwear = "footwear"
    accessories = "accessories"


class CustomerType(str, Enum):
    early = "early"
    mass = "mass"
    late = "late"
    all = "all"


class DateRangeModel(BaseModel):
    start: str
    end: str


class CalculationInputBody(BaseModel):
    calculation_type: CalculationType
    market: Market
    department: Department
    customer_type: CustomerType
    region: str = Field(..., min_length=1, max_length=160)
    date_range: DateRangeModel
    category: str = Field(..., min_length=1, max_length=800)
    item: str = Field(..., min_length=1, max_length=4000)
    asp: float = Field(..., gt=0)
    planned_mix_percent: float = Field(..., ge=0, le=100)
    planned_units: int = Field(..., gt=0)
    expected_sell_through_percent: float = Field(..., ge=0, le=100)

    @field_validator("region", mode="before")
    @classmethod
    def normalize_region(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("category", "item", mode="before")
    @classmethod
    def normalize_text(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class CalculationCreateResponse(BaseModel):
    calculation_id: str
    report_id: str
    status: str


class CalculationStatusResponse(BaseModel):
    id: str
    status: str
    created_at: Optional[str] = None
