import logging
from datetime import datetime, timezone
from typing import List, Optional
from urllib.parse import urlparse

from app.schemas.raw_signal import RawSignal

logger = logging.getLogger(__name__)


def _published_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def process_signals(raw: List[RawSignal]) -> List[RawSignal]:
    seen: set = set()
    cleaned: List[RawSignal] = []
    now = datetime.now(tz=timezone.utc)

    sorted_raw = sorted(
        raw,
        key=lambda s: (-(s.relevance_score or 0), s.url),
    )

    for s in sorted_raw:
        path_key = urlparse(s.url).path
        dedupe = f"{s.source_type}:{path_key}"
        if dedupe in seen:
            continue
        seen.add(dedupe)

        pub = _published_dt(s.published_at)
        rel = float(s.relevance_score or 50)
        if pub:
            age_days = max(0.0, (now - pub).total_seconds() / 86400)
            decay = max(30.0, 120.0 - age_days)
            rel = rel * min(1.0, decay / 120.0)

        cleaned.append(
            RawSignal(
                source_type=s.source_type,
                title=s.title.strip()[:280],
                url=s.url.strip(),
                snippet=s.snippet.strip()[:1200],
                published_at=s.published_at,
                trend_keywords=list(dict.fromkeys(s.trend_keywords or []))[:24],
                relevance_score=min(100.0, max(0.0, rel)),
            )
        )

    logger.info("signals_processed input=%s output=%s", len(raw), len(cleaned))
    return cleaned
