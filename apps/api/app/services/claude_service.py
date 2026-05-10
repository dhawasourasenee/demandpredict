import json
import logging
import anthropic
import re

from app.core.config import Settings
from app.schemas.calculation import CalculationInputBody
from app.schemas.raw_signal import RawSignal
from app.schemas.report_contracts import ClaudeTrendAnalysis
from app.services.prompt_templates import SYSTEM_PROMPT, user_prompt_block

logger = logging.getLogger(__name__)


def _region_hint_score(region: str) -> float:
    r = region.strip().upper()
    if any(k in r for k in ("US", "USA", "NAM", "NORTH AMERICA")):
        return 70.0
    if any(k in r for k in ("EMEA", "EUROPE", "UNITED KINGDOM")) or ("UK" in r and "/" in region):
        return 65.0
    if any(k in r for k in ("APAC", "ASIA", "PACIFIC", "INDIA", "SOUTH ASIA", "SEA", "ASEAN")):
        return 60.0
    return 62.0


def _heuristic_analysis(inp: CalculationInputBody, signals: list[RawSignal]) -> ClaudeTrendAnalysis:
    avg_rel = (
        sum(s.relevance_score or 0 for s in signals) / len(signals) if signals else 45.0
    )

    ct = inp.customer_type.value
    viability = avg_rel + (8 if ct in ("mass", "all") else 0)
    trend_strength = min(100.0, avg_rel + 5)
    regional = _region_hint_score(inp.region)
    seasonal = min(92.0, 55 + viability * 0.25)

    saturation = max(25.0, 85 - viability * 0.45 + (30 if inp.planned_mix_percent > 22 else 0))
    momentum = min(92.0, max(38.0, trend_strength * 0.8 - saturation * 0.35))

    rec = inp.planned_mix_percent + ((momentum - 55) * 0.35)
    if saturation > 70 and momentum < 50:
        rec = min(rec, inp.planned_mix_percent + 2)

    recommended = float(min(95.0, max(5.0, rec)))

    status_explanation = (
        f"Momentum sits near {round(momentum, 1)} with saturation risk {round(saturation, 1)}. "
        f"Compared to planned mix {round(inp.planned_mix_percent, 2)}%, a move toward "
        f"{round(recommended, 2)}% is suggested only as an approximate directional view."
    )

    opp = []
    opp_map = [
        ("Harrington jacket", "utility outerwear"),
        ("Anorak", "sport outdoor"),
        ("Cropped blazer", "novelty tailoring"),
        ("Utility jacket", "workwear crossover"),
        ("Soft tailoring separates", "quiet luxury tailoring"),
        ("Elevated officewear", "workleisure hybrids"),
    ]
    for label, kw in opp_map:
        if kw and kw not in " ".join([inp.category, inp.item]):
            opp.append(label)
        if len(opp) >= 5:
            break

    risks = [
        "Live consumer demand may diverge from editorial and retailer listing signals.",
        "Trend momentum is not a guarantee of SKU-level commercial performance.",
        "Regional adoption curves differ; extrapolate cautiously beyond the grounded region signals.",
    ]

    return ClaudeTrendAnalysis(
        trend_strength=min(100.0, trend_strength),
        commercial_viability=min(100.0, viability),
        regional_relevance=float(regional),
        seasonal_relevance=seasonal,
        customer_fit=(
            62.0
            if ct == "early"
            else 70.0
            if ct == "mass"
            else 66.0
            if ct == "all"
            else 60.0
        ),
        saturation_risk=min(100.0, saturation),
        momentum=momentum,
        recommended_mix_percent=recommended,
        status_explanation=status_explanation,
        assortment_recommendation=(
            f"Treat {inp.item} as an illustrative opportunity adjustment vs planned mix "
            "pending stronger live evidence ingestion."
        ),
        related_opportunity_labels=opp[:6],
        risks=risks,
        confidence_reasoning=(
            f"Confidence is moderated by mock or partial evidence counts ({len(signals)} snippets). "
            "Increase confidence when Apify returns wider retailer and social corroboration."
        ),
        evidence_linked_summary=[
            s.snippet[:200] + ("…" if len(s.snippet) > 200 else "")
            for s in signals[:4]
        ],
    )


def _extract_json_blob(text: str) -> dict:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?\s*", "", stripped)
        stripped = re.sub(r"\s*```$", "", stripped)
    return json.loads(stripped.strip())


async def infer_trends(inp: CalculationInputBody, signals: list[RawSignal], settings: Settings) -> ClaudeTrendAnalysis:
    if not settings.anthropic_api_key.strip():
        return _heuristic_analysis(inp, signals)

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    bullets = [f"[{s.source_type}] {s.title}: {s.snippet[:400]}" for s in signals[:20]]
    inp_dict = inp.model_dump(mode="json")
    user_prompt = user_prompt_block(inp_dict, bullets)

    first = await client.messages.create(
        model="claude-3-5-sonnet-latest",
        max_tokens=1500,
        temperature=0.2,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = first.content[0].text if first.content else ""
    try:
        data = _extract_json_blob(raw_text)
        return ClaudeTrendAnalysis.model_validate(data)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning("claude_invalid_json_retry: %s", exc)
        fix = await client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=900,
            temperature=0,
            system="Rewrite the previous assistant message as VALID JSON ONLY for ClaudeTrendAnalysis keys.",
            messages=[
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": raw_text[:8000]},
                {"role": "user", "content": "Respond with JSON ONLY. No prose."},
            ],
        )
        txt2 = fix.content[0].text if fix.content else ""
        data2 = _extract_json_blob(txt2)
        return ClaudeTrendAnalysis.model_validate(data2)
