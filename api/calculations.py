from __future__ import annotations

import math
from typing import Any

from api.schemas import BusinessContext


def _currency_symbol(region: str) -> str:
    r = region.lower()
    if "india" in r or "inr" in r:
        return "₹"
    if "uk" in r or "britain" in r or "gbp" in r:
        return "£"
    if "eu" in r or "europe" in r or "eur" in r:
        return "€"
    return "$"


def _format_compact_currency(amount: float, symbol: str) -> str:
    a = abs(amount)
    if a >= 1_000_000:
        s = f"{a / 1_000_000:.1f}M"
        return f"{symbol}{s}".replace(".0M", "M")
    if a >= 1000:
        return f"{symbol}{round(a / 1000)}K"
    return f"{symbol}{round(a):,}"


def _build_trend_score_bars(t: dict[str, Any], ctx: BusinessContext) -> list[dict[str, Any]]:
    specs: list[tuple[str, str]] = [
        ("trend_strength", "Trend strength"),
        ("commercial_viability", "Commercial viability"),
        ("momentum_score", "Momentum"),
        ("regional_relevance", f"Regional relevance ({ctx.region})"),
        ("seasonal_relevance", f"Seasonal relevance ({ctx.season})"),
        ("customer_fit", f"Customer fit ({ctx.target_customer})"),
        ("saturation_risk", "Saturation risk"),
    ]
    out: list[dict[str, Any]] = []
    for key, label in specs:
        sc = int(t.get(key, 0))
        if key == "saturation_risk":
            tone = "caution" if sc >= 55 else "positive"
        elif sc >= 70:
            tone = "positive"
        elif sc >= 50:
            tone = "caution"
        else:
            tone = "neutral"
        out.append({"key": key, "label": label, "score": sc, "tone": tone})
    return out


def _build_momentum_trendline(momentum_end: int, category: str, season: str) -> dict[str, Any]:
    dates = [
        "2026-01-01",
        "2026-01-15",
        "2026-02-01",
        "2026-02-15",
        "2026-03-01",
        "2026-03-15",
        "2026-03-31",
    ]
    end = max(40, min(100, int(momentum_end)))
    start = max(40, end - 26)
    n = len(dates)
    points: list[dict[str, Any]] = []
    for i in range(n):
        t = i / (n - 1) if n > 1 else 1.0
        eased = 1 - (1 - t) ** 2
        v = start + (end - start) * eased
        points.append({"date": dates[i], "index_value": round(v)})
    cat = (category or "Category").strip().upper()
    return {
        "title": f"Momentum trendline — {cat}",
        "subtitle": f"Relative index · {season} · Jan–Mar 2026",
        "points": points,
    }


def _build_dashboard(
    report: dict[str, Any],
    ctx: BusinessContext,
    t: dict[str, Any],
    o: dict[str, Any],
    planned_mix: float,
    rec_mix_raw: float,
    mix_delta: float,
    planned_u: int,
    asp: float,
) -> None:
    sym = _currency_symbol(ctx.region)
    inc = int(o.get("incremental_sales_opportunity") or 0)
    g = report.setdefault("garment_analysis", {})
    category = str(g.get("category") or "Category")

    mix_ctx = (o.get("mix_assortment_context") or "").strip() or "Of assortment"

    if mix_delta > 0:
        gap_summary = f"Under-indexed by {abs(mix_delta):.1f}%"
    elif mix_delta < 0:
        gap_summary = f"Over-indexed by {abs(mix_delta):.1f}%"
    else:
        gap_summary = "In line with planned mix"

    st_pct = float(ctx.expected_sell_through_percent)

    report["financial_summary"] = {
        "currency_symbol": sym,
        "average_selling_price": round(asp, 2),
        "average_selling_price_caption": "Per unit",
        "planned_units": planned_u,
        "planned_units_caption": f"{ctx.season} forecast",
        "planned_mix_percent": round(planned_mix, 1),
        "planned_mix_caption": mix_ctx,
        "recommended_mix_percent": round(rec_mix_raw, 1),
        "recommended_mix_caption": "AI-adjusted target",
        "opportunity_gap_percent": round(mix_delta, 1),
        "opportunity_gap_caption": "Under-indexed"
        if mix_delta > 0
        else ("Over-indexed" if mix_delta < 0 else "In line"),
        "incremental_revenue": inc,
        "incremental_revenue_compact": _format_compact_currency(float(inc), sym),
        "incremental_revenue_caption": f"At {st_pct:.0f}% sell-through",
    }

    report["trend_score_bars"] = _build_trend_score_bars(t, ctx)

    report["assortment_dashboard"] = {
        "adoption_stage": str(o.get("adoption_stage") or ""),
        "mix_context_line": mix_ctx,
        "planned_mix_percent": round(planned_mix, 1),
        "recommended_mix_percent": round(rec_mix_raw, 1),
        "gap_percent": round(mix_delta, 1),
        "opportunity_summary": gap_summary,
        "incremental_explanation": (
            f"Incremental opportunity: {sym}{inc:,.0f} at {st_pct:.0f}% ST"
        ),
        "calculation_formula": (
            f"Calc: |{mix_delta:.1f}% / 100| × {planned_u} × {sym}{asp:.0f} × {st_pct:.0f}% = {sym}{inc:,.0f}"
        ),
    }

    report["momentum_trendline"] = _build_momentum_trendline(
        int(t.get("momentum_score", 0)), category, ctx.season
    )


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

    _build_dashboard(report, ctx, t, o, planned_mix, rec_mix_raw, mix_delta, planned_u, asp)

    return report
