from __future__ import annotations

import math
from typing import Any

from api.schemas import BusinessContext
from api.season_timeline import season_momentum_window


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


def _clamp_momentum_chart_value(value: Any) -> int:
    """Relative index on chart is shown in a ~40–100 band."""
    return _clamp_int(value, 40, 100)


def _build_momentum_trendline(trend: dict[str, Any], category: str, ctx: BusinessContext) -> dict[str, Any]:
    win = season_momentum_window(ctx.season)
    dates = list(win.dates)
    end = _clamp_momentum_chart_value(trend.get("momentum_score", 0))
    raw_series = trend.get("momentum_monthly_index")
    n = len(dates)
    points: list[dict[str, Any]]

    if isinstance(raw_series, list) and len(raw_series) >= n:
        points = []
        for i in range(n):
            v = _clamp_momentum_chart_value(raw_series[i])
            points.append({"date": dates[i], "index_value": int(v)})
        points[-1]["index_value"] = end
    else:
        start = max(40, end - 26)
        points = []
        for i in range(n):
            tfrac = i / (n - 1) if n > 1 else 1.0
            eased = 1 - (1 - tfrac) ** 2
            v = start + (end - start) * eased
            points.append({"date": dates[i], "index_value": round(v)})
    cat = (category or "Category").strip().upper()
    season = (ctx.season or "").strip()
    return {
        "title": f"Momentum trendline — {cat}",
        "subtitle": f"Relative index · {season} · {win.range_label}",
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

    fr = report.get("financial_reasoning")
    frd: dict[str, Any] = fr if isinstance(fr, dict) else {}

    def _reason(key: str) -> str:
        v = frd.get(key)
        return str(v).strip() if v is not None else ""

    report["financial_summary"] = {
        "currency_symbol": sym,
        "average_selling_price": round(asp, 2),
        "average_selling_price_caption": "Per unit",
        "average_selling_price_reasoning": _reason("average_selling_price"),
        "planned_units": planned_u,
        "planned_units_caption": f"{ctx.season} forecast",
        "planned_units_reasoning": _reason("planned_units"),
        "planned_mix_percent": round(planned_mix, 1),
        "planned_mix_caption": mix_ctx,
        "planned_mix_reasoning": _reason("planned_mix_percent"),
        "recommended_mix_percent": round(rec_mix_raw, 1),
        "recommended_mix_caption": "AI-adjusted target",
        "recommended_mix_reasoning": _reason("recommended_mix_percent"),
        "opportunity_gap_percent": round(mix_delta, 1),
        "opportunity_gap_caption": "Under-indexed"
        if mix_delta > 0
        else ("Over-indexed" if mix_delta < 0 else "In line"),
        "opportunity_gap_reasoning": _reason("opportunity_gap_percent"),
        "incremental_revenue": inc,
        "incremental_revenue_compact": _format_compact_currency(float(inc), sym),
        "incremental_revenue_caption": f"At planner {st_pct:.0f}% sell-through",
        "incremental_revenue_reasoning": _reason("incremental_revenue"),
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

    report["momentum_trendline"] = _build_momentum_trendline(t, category, ctx)


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

    mmi = t.get("momentum_monthly_index")
    if isinstance(mmi, list) and len(mmi) >= 7:
        t["momentum_monthly_index"] = [_clamp_momentum_chart_value(x) for x in mmi[:7]]
    else:
        t.pop("momentum_monthly_index", None)

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

    _merge_sell_through_analysis(
        report,
        ctx,
        incremental_units,
        asp,
        int(o["incremental_sales_opportunity"]),
    )

    _build_dashboard(report, ctx, t, o, planned_mix, rec_mix_raw, mix_delta, planned_u, asp)

    report.pop("financial_reasoning", None)

    _normalize_extended_fields(report, o)

    return report


def _merge_sell_through_analysis(
    report: dict[str, Any],
    ctx: BusinessContext,
    incremental_units: float,
    asp: float,
    incremental_sales_planner_st: int,
) -> None:
    """Fills sell_through_analysis with planner vs AI ST and incremental at AI ST."""
    raw = report.get("sell_through_analysis")
    st: dict[str, Any] = raw if isinstance(raw, dict) else {}
    report["sell_through_analysis"] = st

    buyer = _clamp_float(ctx.expected_sell_through_percent, 0.0, 100.0)
    st["buyer_assumption_percent"] = round(buyer, 1)

    try:
        ai = float(st.get("ai_expected_sell_through_percent", buyer))
    except (TypeError, ValueError):
        ai = buyer
    ai = max(0.0, min(100.0, ai))
    st["ai_expected_sell_through_percent"] = round(ai, 1)
    st["final_sell_through_percent"] = st["ai_expected_sell_through_percent"]

    st.setdefault("summary", str(st.get("summary") or "").strip())
    st.setdefault("reasoning", str(st.get("reasoning") or "").strip())
    ud = st.get("upside_drivers")
    st["upside_drivers"] = ud if isinstance(ud, list) else []
    rf = st.get("risk_factors")
    st["risk_factors"] = rf if isinstance(rf, list) else []

    sym = _currency_symbol(ctx.region)
    inc_ai = incremental_units * asp * (ai / 100.0)
    st["incremental_revenue_at_ai_st"] = int(round(inc_ai))
    st["incremental_revenue_at_ai_st_compact"] = _format_compact_currency(float(inc_ai), sym)
    st["planner_incremental_revenue"] = incremental_sales_planner_st


def _normalize_extended_fields(report: dict[str, Any], o: dict[str, Any]) -> None:
    for ev in report.get("evidence_summary") or []:
        if isinstance(ev, dict):
            ev.setdefault("source_channel", "")

    for risk in report.get("risks") or []:
        if not isinstance(risk, dict):
            continue
        sev = str(risk.get("severity", "")).lower()
        if sev not in ("low", "medium", "high"):
            risk["severity"] = "medium"

    for rel in report.get("related_opportunities") or []:
        if not isinstance(rel, dict):
            continue
        if not (rel.get("tag") or "").strip():
            rel["tag"] = str(rel.get("momentum") or "").strip()
        tv = str(rel.get("tag_variant", "")).lower()
        if tv not in ("green", "blue", "gold", "neutral"):
            rel["tag_variant"] = "neutral"

    fr = report.setdefault("final_recommendation", {})
    if isinstance(fr, dict):
        fr.setdefault("headline", "")
        if not (fr.get("headline") or "").strip() and (fr.get("summary") or "").strip():
            mix = o.get("recommended_mix_percent")
            if mix is not None:
                fr["headline"] = f"Recommendation: increase assortment mix toward {mix}%"

    md = report.setdefault("report_metadata", {})
    if isinstance(md, dict):
        md.setdefault("sources_overview", "")
        md.setdefault("retail_signals", "")
        md.setdefault("confidence_note", "")

    st = report.get("sell_through_analysis")
    if isinstance(st, dict):
        st.setdefault("summary", "")
        st.setdefault("reasoning", "")
        st.setdefault("buyer_assumption_percent", 0.0)
        st.setdefault("ai_expected_sell_through_percent", 0.0)
        st.setdefault("final_sell_through_percent", 0.0)
        for key in ("upside_drivers", "risk_factors"):
            xs = st.get(key)
            if isinstance(xs, list):
                st[key] = [str(x).strip() for x in xs if str(x).strip()]
            else:
                st[key] = []
