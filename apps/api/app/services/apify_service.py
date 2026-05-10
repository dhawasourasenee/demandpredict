import logging
from datetime import datetime, timedelta, timezone

from app.core.config import Settings
from app.schemas.calculation import CalculationInputBody
from app.schemas.raw_signal import RawSignal
from app.services.query_expander import expand_queries

logger = logging.getLogger(__name__)


def collect_mock_signals(inp: CalculationInputBody, request_id: str) -> list[RawSignal]:
    expanded = expand_queries(inp)
    now = datetime.now(tz=timezone.utc)
    base_kw = [inp.item, inp.category, "quiet luxury", "mass retail"]

    signals: list[RawSignal] = []
    for i, q in enumerate(expanded.all_queries[:6]):
        days_ago = 3 + i * 5
        published = (now - timedelta(days=days_ago)).date().isoformat()
        signals.append(
            RawSignal(
                source_type="fashion_article" if i % 2 == 0 else "search_result",
                title=f"Sample coverage: {q[:48]}…",
                url=f"https://example.invalid/evidence/{request_id}/{i}",
                snippet=(
                    f"Editorial signal for {inp.item} in {inp.market.value} {inp.region.strip()}. "
                    f"Keywords align with planner context; treat as illustrative until live Apify feeds run."
                ),
                published_at=published,
                trend_keywords=list(base_kw),
                relevance_score=78.0 - i * 3,
            )
        )
    logger.info(
        "apify_collect mode=mock count=%s request_id_prefix=%s",
        len(signals),
        request_id[:8],
    )
    return signals


async def collect_signals(inp: CalculationInputBody, settings: Settings, request_id: str) -> list[RawSignal]:
    if not settings.apify_token.strip():
        return collect_mock_signals(inp, request_id)
    # Phase 4: wire Apify actor runs + polling here.
    logger.warning(
        "apify_token set but actor integration pending; falling back to mock %s",
        request_id[:8],
    )
    return collect_mock_signals(inp, request_id)
