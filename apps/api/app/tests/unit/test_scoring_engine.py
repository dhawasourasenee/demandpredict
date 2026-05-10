from app.schemas.calculation import (
    CalculationInputBody,
    CalculationType,
    CustomerType,
    DateRangeModel,
    Department,
    Market,
)
from app.schemas.report_contracts import ClaudeTrendAnalysis
from app.services.scoring_engine import IndexStatus, compute_scores


def _sample_input() -> CalculationInputBody:
    return CalculationInputBody(
        calculation_type=CalculationType.forecast,
        market=Market.women,
        department=Department.apparel,
        customer_type=CustomerType.mass,
        region="US",
        date_range=DateRangeModel(start="2026-01-01", end="2026-03-31"),
        category="jackets",
        item="blazer",
        asp=130.0,
        planned_mix_percent=14.6,
        planned_units=300,
        expected_sell_through_percent=68.0,
    )


def _sample_ai(rec_mix: float) -> ClaudeTrendAnalysis:
    return ClaudeTrendAnalysis(
        trend_strength=70,
        commercial_viability=74,
        regional_relevance=70,
        seasonal_relevance=72,
        customer_fit=70,
        saturation_risk=40,
        momentum=65,
        recommended_mix_percent=rec_mix,
        status_explanation="Unit test synthesized explanation.",
        assortment_recommendation="Adjust mix cautiously.",
        related_opportunity_labels=["Harrington jacket"],
        risks=["Synthetic risk"],
        confidence_reasoning="Synthetic confidence.",
        evidence_linked_summary=["Synthetic evidence line."],
    )


def test_under_indexed_and_incremental_formula():
    inp = _sample_input()
    gap = 5.4
    ai = _sample_ai(rec_mix=inp.planned_mix_percent + gap)
    out = compute_scores(inp, ai)
    assert out.status == IndexStatus.under_indexed
    expected_inc = abs(gap / 100) * inp.planned_units * inp.asp * (inp.expected_sell_through_percent / 100)
    assert abs(out.incremental_opportunity_estimate - expected_inc) < 0.01
    expected_units = abs(gap / 100) * inp.planned_units
    assert abs(out.additional_units_estimate - expected_units) < 0.01


def test_aligned_band():
    inp = _sample_input()
    ai = _sample_ai(rec_mix=inp.planned_mix_percent + 0.5)
    out = compute_scores(inp, ai)
    assert out.status == IndexStatus.aligned
