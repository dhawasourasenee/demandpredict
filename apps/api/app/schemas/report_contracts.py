"""Structured AI + report shapes (validated after Claude / mock)."""

from typing import List, Optional

from pydantic import BaseModel, Field


class ClaudeTrendAnalysis(BaseModel):
    trend_strength: float = Field(..., ge=0, le=100)
    commercial_viability: float = Field(..., ge=0, le=100)
    regional_relevance: float = Field(..., ge=0, le=100)
    seasonal_relevance: float = Field(..., ge=0, le=100)
    customer_fit: float = Field(..., ge=0, le=100)
    saturation_risk: float = Field(..., ge=0, le=100)
    momentum: float = Field(..., ge=0, le=100)
    recommended_mix_percent: float = Field(..., ge=0, le=100)
    status_explanation: str
    assortment_recommendation: str
    related_opportunity_labels: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    confidence_reasoning: str
    evidence_linked_summary: List[str] = Field(default_factory=list)


class EvidenceCardPayload(BaseModel):
    source_title: str
    url: str
    date: Optional[str]
    snippet: str
    trend_keywords: List[str] = Field(default_factory=list)
