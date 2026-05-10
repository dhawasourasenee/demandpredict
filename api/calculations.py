from __future__ import annotations

import math
from typing import Any

from api.schemas import BusinessContext


def _clamp_int(value: Any, lo: int = 0, hi: int = 100) -> int:
    try:
        x = int(round(float(value)))
    except (TypeError, ValueError):
        x = 0
    return max(lo, min(hi, x))


def _clamp_float(value: Any, lo: float, hi: float) -> float:
    try:
        x = float(value)
    except (TypeError, ValueError):
        x = lo
    return max(lo, min(hi, x))


def apply_final_calculations(report: dict[str, Any], ctx: BusinessContext) -> dict[str, Any]:
    """
    Deterministic financial / KPI fields. Keeps LLM narrative and structure;
    overwrites opportunity_analysis numbers and clamps trend scores.
    """
    t = report.setdefault("trend_analysis", {})
    for key in (
        "trend_strength",
        "commercial_viability",
        "regional_relevance",
        "seasonal_relevance",
        "customer_fit",
        "momentum_score",
        "saturation_risk",
        "confidence_score",
    ):
        t[key] = _clamp_int(t.get(key))

    o = report.setdefault("opportunity_analysis", {})

    planned_mix = _clamp_float(ctx.planned_assortment_mix_percent, 0.0, 100.0)
    rec_mix_raw = _clamp_float(o.get("recommended_mix_percent", planned_mix), 0.0, 100.0)

    planned_u = max(0, int(ctx.planned_units))
    asp = max(0.0, float(ctx.average_selling_price))
    st = _clamp_float(ctx.expected_sell_through_percent, 0.0, 100.0) / 100.0

    mix_delta = rec_mix_raw - planned_mix
    o["opportunity_gap_percent"] = round(mix_delta, 1)
    o["recommended_mix_percent"] = round(rec_mix_raw, 1)

    incremental_units = planned_u * max(0.0, mix_delta) / 100.0
    incremental_sales = incremental_units * asp * st
    o["incremental_sales_opportunity"] = int(round(incremental_sales))

    if planned_mix > 0:
        o["recommended_units"] = int(max(0, round(planned_u * (rec_mix_raw / planned_mix))))
    else:
        o["recommended_units"] = planned_u

    if not math.isfinite(o["incremental_sales_opportunity"]):
        o["incremental_sales_opportunity"] = 0

    return report
