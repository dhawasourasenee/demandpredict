"""Map buyer season codes (e.g. FA26, SS26) to momentum-chart date checkpoints."""

from __future__ import annotations

import calendar
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class SeasonMomentumWindow:
    """Seven ISO dates (chronological) and a human subtitle fragment."""

    dates: tuple[str, ...]
    range_label: str
    year: int
    season_token: str


def _add_months(year: int, month: int, delta: int) -> tuple[int, int]:
    idx = year * 12 + (month - 1) + delta
    ny, nm0 = divmod(idx, 12)
    return ny, nm0 + 1


def _seven_checkpoint_dates(year: int, start_month: int) -> list[str]:
    """Jan-style rhythm: 1st & 15th of each of three consecutive months, plus last day of final month."""
    dates: list[str] = []
    for mi in range(3):
        yc, mc = _add_months(year, start_month, mi)
        dates.append(f"{yc:04d}-{mc:02d}-01")
        if mi < 2:
            dates.append(f"{yc:04d}-{mc:02d}-15")
        else:
            dates.append(f"{yc:04d}-{mc:02d}-15")
            ld = calendar.monthrange(yc, mc)[1]
            dates.append(f"{yc:04d}-{mc:02d}-{ld:02d}")
    return dates


def _range_label(year: int, start_month: int) -> str:
    y0, m0 = year, start_month
    y2, m2 = _add_months(year, start_month, 2)
    abbr = (
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    )
    if y0 == y2:
        return f"{abbr[m0 - 1]}–{abbr[m2 - 1]} {y0}"
    return f"{abbr[m0 - 1]} {y0}–{abbr[m2 - 1]} {y2}"


# First month of a 3-month selling / read-through window for the season family.
_PREFIX_START_MONTH: dict[str, int] = {
    # Spring / summer
    "SS": 4,
    "SC": 4,
    "HS": 5,
    "RS": 3,
    "CR": 1,
    "SU": 5,
    "SP": 3,
    # Fall / winter buy & floor
    "FA": 8,
    "FW": 8,
    "FL": 8,
    "FE": 8,
    "PF": 7,
    "AW": 10,
    "WW": 11,
    "WI": 11,
    "HO": 10,
    "HF": 11,
}


def _parse_season_token(raw: str) -> tuple[str | None, int]:
    s = re.sub(r"\s+", "", raw.strip().upper())
    if not s:
        return None, 2026

    m = re.match(r"^([A-Z]{2,8})(\d{2}|\d{4})$", s)
    if m:
        yy = m.group(2)
        y = int(yy) if len(yy) == 4 else (2000 + int(yy) if int(yy) < 70 else 1900 + int(yy))
        return m.group(1), y

    m = re.match(r"^(\d{2}|\d{4})([A-Z]{2,8})$", s)
    if m:
        yy = m.group(1)
        y = int(yy) if len(yy) == 4 else (2000 + int(yy) if int(yy) < 70 else 1900 + int(yy))
        return m.group(2), y

    m = re.match(r"^(\d{4})$", s)
    if m:
        return None, int(m.group(1))

    return None, 2026


def season_momentum_window(season_field: str) -> SeasonMomentumWindow:
    """
    Build seven chronological dates and a label like "Aug–Oct 2026".
    Unknown codes default to Jan–Mar of inferred year (legacy behavior).
    """
    prefix, year = _parse_season_token(season_field)
    start_month = 1
    if prefix:
        start_month = _PREFIX_START_MONTH.get(prefix, 1)

    dates = _seven_checkpoint_dates(year, start_month)
    label = _range_label(year, start_month)
    token = season_field.strip() or f"{year}"
    return SeasonMomentumWindow(
        dates=tuple(dates),
        range_label=label,
        year=year,
        season_token=token,
    )
