import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple

from sqlmodel import Session

from app.core.config import Settings
from app.core.request_context import get_request_id
from app.models.calculation import Calculation
from app.models.evidence import EvidenceSource
from app.models.report import Report
from app.repositories import calculation_repo, evidence_repo, report_repo
from app.schemas.calculation import CalculationInputBody
from app.services import apify_service, claude_service, signal_processor
from app.services.report_builder import build_final_report_payload, evidence_cards_from_signals
from app.services.scoring_engine import compute_scores
from app.services.trendline_engine import build_trendline

logger = logging.getLogger(__name__)


async def run_calculation(session: Session, inp: CalculationInputBody, settings: Settings) -> Tuple[str, str]:
    req = get_request_id()
    calc_id = str(uuid.uuid4())

    calculation_repo.create(
        session,
        Calculation(
            id=calc_id,
            user_id=None,
            input_json=inp.model_dump_json(),
            status="processing",
        ),
    )
    session.commit()

    try:
        raw = await apify_service.collect_signals(inp, settings, req)
        processed = signal_processor.process_signals(raw)

        for s in processed:
            evidence_repo.add(
                session,
                EvidenceSource(
                    id=str(uuid.uuid4()),
                    calculation_id=calc_id,
                    source_type=s.source_type,
                    title=s.title,
                    url=s.url,
                    snippet=s.snippet,
                    published_at=_parse_dt(s.published_at),
                    relevance_score=float(s.relevance_score or 0),
                    raw_json=s.model_dump_json(),
                ),
            )

        ai = await claude_service.infer_trends(inp, processed, settings)
        scores = compute_scores(inp, ai)
        trendline, est_flag = build_trendline(inp, processed, ai, scores.recommended_mix_percent)
        cards = evidence_cards_from_signals(processed)
        payload = build_final_report_payload(inp, ai, scores, trendline, cards, est_flag)

        report_id = str(uuid.uuid4())
        report_repo.create(
            session,
            Report(
                id=report_id,
                calculation_id=calc_id,
                report_json=json.dumps(payload),
                confidence_level=str(payload["confidence"]["level"]),
            ),
        )

        calculation_repo.mark_done(session, calc_id)
        session.commit()
        logger.info("calculation_complete id=%s report=%s", calc_id, report_id)
        return calc_id, report_id
    except Exception as exc:
        logger.exception("calculation_failed id=%s err=%s", calc_id, exc)
        calculation_repo.mark_failed(session, calc_id, str(exc))
        session.commit()
        raise


def _parse_dt(value: Optional[str]):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo:
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except ValueError:
        return None
