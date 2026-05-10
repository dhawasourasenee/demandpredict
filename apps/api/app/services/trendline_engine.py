from datetime import date, datetime
from statistics import mean

from pydantic import BaseModel

from app.schemas.calculation import CalculationInputBody
from app.schemas.raw_signal import RawSignal
from app.schemas.report_contracts import ClaudeTrendAnalysis


class TrendPoint(BaseModel):
    period: str
    trend_index: float
    confidence_low: float
    confidence_high: float
    planned_mix_overlay: float
    recommended_window_low: float
    recommended_window_high: float
    estimated: bool


def _month_series(start_iso: str, end_iso: str) -> list[date]:
    ys, ms, _ = map(int, start_iso.split("-"))
    ye, me, _ = map(int, end_iso.split("-"))
    d = date(ys, ms, 1)
    end = date(ye, me, 1)
    out: list[date] = []
    while d <= end and len(out) < 24:
        out.append(d)
        if d.month == 12:
            d = date(d.year + 1, 1, 1)
        else:
            d = date(d.year, d.month + 1, 1)
    return out or [date.today().replace(day=1)]


def _signal_index_by_month(signals: list[RawSignal]) -> dict[str, float]:
    buckets: dict[str, list[float]] = {}
    for s in signals:
        if not s.published_at:
            continue
        try:
            dt = datetime.fromisoformat(s.published_at.replace("Z", "+00:00"))
        except ValueError:
            continue
        key = f"{dt.year}-{dt.month:02d}"
        buckets.setdefault(key, []).append(float(s.relevance_score or 50))
    return {k: mean(v) for k, v in buckets.items()}


def build_trendline(
    inp: CalculationInputBody,
    signals: list[RawSignal],
    ai: ClaudeTrendAnalysis,
    scoring_recommended: float,
) -> tuple[list[TrendPoint], bool]:
    months = _month_series(inp.date_range.start, inp.date_range.end)
    by_m = _signal_index_by_month(signals)
    estimated = len(by_m) < 2

    points: list[TrendPoint] = []
    last_val = ai.momentum
    for d in months:
        key = f"{d.year}-{d.month:02d}"
        if key in by_m:
            last_val = by_m[key]
        elif estimated:
            last_val = max(20.0, min(100.0, last_val + (ai.momentum - 55) * 0.05))

        low = max(0.0, last_val - 8 - (15 if estimated else 8))
        high = min(100.0, last_val + 8 + (12 if estimated else 8))

        rec_low = max(0.0, scoring_recommended - 4)
        rec_high = min(100.0, scoring_recommended + 4)

        points.append(
            TrendPoint(
                period=d.isoformat(),
                trend_index=round(last_val, 2),
                confidence_low=round(low, 2),
                confidence_high=round(high, 2),
                planned_mix_overlay=float(inp.planned_mix_percent),
                recommended_window_low=round(rec_low, 2),
                recommended_window_high=round(rec_high, 2),
                estimated=estimated,
            )
        )
    return points, estimated
