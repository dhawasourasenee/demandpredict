from enum import Enum

from pydantic import BaseModel

from app.schemas.calculation import CalculationInputBody
from app.schemas.report_contracts import ClaudeTrendAnalysis


class IndexStatus(str, Enum):
    under_indexed = "under_indexed"
    over_indexed = "over_indexed"
    aligned = "aligned"


class ScoringOutput(BaseModel):
    opportunity_gap_percent: float
    status: IndexStatus
    incremental_opportunity_estimate: float
    additional_units_estimate: float
    recommended_mix_percent: float
    ai_confidence_score: float


def _overall_confidence(inp: CalculationInputBody, ai: ClaudeTrendAnalysis) -> float:
    base_components = [
        ai.trend_strength,
        ai.commercial_viability,
        ai.regional_relevance,
        ai.seasonal_relevance,
        ai.customer_fit,
    ]
    weighted = sum(base_components) / max(1, len(base_components))

    ct = inp.customer_type.value
    if ct == "mass":
        weighted = weighted * 0.55 + ai.commercial_viability * 0.45
    elif ct == "all":
        weighted = weighted * 0.58 + ai.commercial_viability * 0.41
    else:
        weighted = weighted * 0.62 + ai.customer_fit * 0.38

    penalty = ai.saturation_risk * 0.35 + max(0.0, 60 - ai.momentum) * 0.35
    score = max(0.0, min(100.0, weighted - penalty * 0.12))
    return round(score, 2)


def compute_scores(inp: CalculationInputBody, ai: ClaudeTrendAnalysis) -> ScoringOutput:
    recommended = float(ai.recommended_mix_percent)
    gap = recommended - float(inp.planned_mix_percent)

    if gap > 1:
        status = IndexStatus.under_indexed
    elif gap < -1:
        status = IndexStatus.over_indexed
    else:
        status = IndexStatus.aligned

    if ai.saturation_risk > 75 and ai.momentum < 45:
        gap = min(gap, max(-1.5, gap))
        recommended = inp.planned_mix_percent + gap

    inc = abs(gap / 100.0) * inp.planned_units * inp.asp * (inp.expected_sell_through_percent / 100.0)

    add_units = abs(gap / 100.0) * inp.planned_units

    return ScoringOutput(
        opportunity_gap_percent=round(gap, 4),
        status=status,
        incremental_opportunity_estimate=round(inc, 2),
        additional_units_estimate=round(add_units, 2),
        recommended_mix_percent=round(min(100.0, max(0.0, recommended)), 4),
        ai_confidence_score=_overall_confidence(inp, ai),
    )
