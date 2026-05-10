from pydantic import BaseModel

from app.schemas.calculation import CalculationInputBody


class ExpandResult(BaseModel):
    main_query: str
    trend_query: str
    retailer_query: str
    social_query: str
    adjacent_query: str
    regional_query: str
    seasonal_query: str
    all_queries: list[str]


def _season_token(date_end: str) -> str:
    parts = date_end.split("-")
    if len(parts) < 2:
        return ""
    month = int(parts[1])
    year_short = parts[0][-2:] if len(parts[0]) >= 2 else ""
    season = "SS" if 1 <= month <= 8 else "AW"
    return f"{season}{year_short}" if year_short else season


def expand_queries(inp: CalculationInputBody) -> ExpandResult:
    m = inp.market.value
    item = inp.item
    cat = inp.category
    region = inp.region.value
    season = _season_token(inp.date_range.end)

    base = f"{m} {item} trend {region}"
    seasonal = f"{base} {season}".strip() if season else base

    retailer = f"{m} mass market {cat} {item} retailer assortment {region}"
    social = f"{item} {m}wear tiktok instagram trend"
    adjacent = f"adjacent styles to {item} {cat} {m}"
    regional = f"{item} adoption {region} {m} consumer"

    all_q = sorted(
        {
            seasonal,
            f"{m} tailored {item} trend",
            f"oversized {item} {m}wear",
            f"{m} {cat} commercial trend {region}",
            retailer.strip(),
            social.strip(),
            adjacent.strip(),
            regional.strip(),
        }
    )

    return ExpandResult(
        main_query=seasonal,
        trend_query=f"{m} {item} fashion editorial trend",
        retailer_query=retailer,
        social_query=social,
        adjacent_query=adjacent,
        regional_query=regional,
        seasonal_query=f"{season} {m} {item}" if season else f"{m} {item}",
        all_queries=list(all_q),
    )
