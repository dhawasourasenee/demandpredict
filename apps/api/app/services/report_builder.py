from app.schemas.calculation import CalculationInputBody
from app.schemas.raw_signal import RawSignal
from app.schemas.report_contracts import ClaudeTrendAnalysis
from app.services.scoring_engine import ScoringOutput
from app.services.trendline_engine import TrendPoint


def build_final_report_payload(
    inp: CalculationInputBody,
    ai: ClaudeTrendAnalysis,
    scores: ScoringOutput,
    trendline: list[TrendPoint],
    evidence_cards: list[dict],
    trend_estimated_flag: bool,
) -> dict:
    label = ", ".join(
        [
            inp.category.title(),
            inp.item.title(),
            inp.market.value.title(),
            inp.region.value,
            f"{inp.date_range.start} → {inp.date_range.end}",
        ]
    )

    return {
        "calculation_summary": {
            "title": label,
            "calculation_mode": inp.calculation_type.value,
            "headline": {
                "item": inp.item.title(),
                "category": inp.category.title(),
                "market": inp.market.value.title(),
                "region": inp.region.value,
                "start": inp.date_range.start,
                "end": inp.date_range.end,
            },
            "planned_mix_percent": inp.planned_mix_percent,
            "recommended_mix_percent": scores.recommended_mix_percent,
            "difference_pp": round(
                scores.recommended_mix_percent - inp.planned_mix_percent,
                2,
            ),
            "confidence_level": "medium" if scores.ai_confidence_score > 55 else "low",
        },
        "trend_scores": {
            "trend_strength": ai.trend_strength,
            "commercial_viability": ai.commercial_viability,
            "regional_relevance": ai.regional_relevance,
            "seasonal_relevance": ai.seasonal_relevance,
            "customer_fit": ai.customer_fit,
            "saturation_risk": ai.saturation_risk,
            "momentum": ai.momentum,
        },
        "assortment_analysis": {
            "status": scores.status.value,
            "opportunity_gap_percent": scores.opportunity_gap_percent,
            "additional_units_estimate": scores.additional_units_estimate,
            "notes": ai.status_explanation,
        },
        "trendline_data": [tp.model_dump() for tp in trendline],
        "opportunity_estimation": {
            "incremental_opportunity_estimate": scores.incremental_opportunity_estimate,
            "disclaimer": (
                "Approximate illustration only—not a revenue guarantee and not sales certainty. "
                f"Trendline is {'estimated' if trend_estimated_flag else 'evidence-guided'} "
                "(see point flags)."
            ),
        },
        "recommendation": {
            "summary": ai.assortment_recommendation,
            "confidence_score": scores.ai_confidence_score,
            "confidence_reasoning": ai.confidence_reasoning,
        },
        "related_opportunities": [{"label": l} for l in ai.related_opportunity_labels],
        "evidence_summary": evidence_cards,
        "risks": ai.risks,
        "confidence": {
            "score": scores.ai_confidence_score,
            "level": (
                "low"
                if scores.ai_confidence_score < 46
                else "medium"
                if scores.ai_confidence_score < 72
                else "high"
            ),
            "trend_vs_sales_note": (
                "Trend momentum differs from transactional sell-through certainty; rely on receipts where possible."
            ),
        },
    }


def evidence_cards_from_signals(signals: list[RawSignal]) -> list[dict]:
    cards: list[dict] = []
    for s in signals:
        cards.append(
            {
                "source_title": s.title,
                "url": s.url,
                "date": s.published_at,
                "snippet": s.snippet,
                "trend_keywords": s.trend_keywords or [],
                "relevance_score": round(float(s.relevance_score or 0), 2),
            }
        )
    return cards
