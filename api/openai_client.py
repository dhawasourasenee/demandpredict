from __future__ import annotations

import json
import os

import httpx

from api.parse_json_util import extract_json_object
from api.schemas import BusinessContext
from api.season_timeline import season_momentum_window
from api.system_prompt import FASHION_OPPORTUNITY_SYSTEM_PROMPT

OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"


def _extract_assistant_json_text(data: dict) -> str:
    """Last assistant output_text in a Responses API payload."""
    out = data.get("output")
    if not isinstance(out, list):
        return ""
    last = ""
    for item in out:
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        if item.get("role") != "assistant":
            continue
        for part in item.get("content") or []:
            if not isinstance(part, dict) or part.get("type") != "output_text":
                continue
            t = part.get("text")
            if isinstance(t, str) and t.strip():
                last = t
    return last


def _web_search_tool(ctx: BusinessContext) -> dict:
    tool: dict = {
        "type": "web_search",
        "search_context_size": "high",
    }
    region = (ctx.region or "").strip()
    if region:
        loc: dict = {"type": "approximate"}
        if len(region) == 2 and region.isalpha():
            loc["country"] = region.upper()
        else:
            loc["region"] = region
        tool["user_location"] = loc
    return tool


async def call_openai_vision(
    image_b64: str,
    image_mime: str,
    ctx: BusinessContext,
) -> dict:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set on the server")

    # Responses API + hosted web_search: use a model that supports both vision and web_search
    # (see https://platform.openai.com/docs/guides/tools-web-search ).
    model = (os.environ.get("OPENAI_MODEL") or "gpt-4.1").strip() or "gpt-4.1"

    win = season_momentum_window(ctx.season)
    timeline_lines = "\n".join(f"  {i + 1}. {d}" for i, d in enumerate(win.dates))

    user_text = (
        f"Business context (JSON):\n{ctx.model_dump_json(indent=2)}\n\n"
        f"Momentum chart checkpoints for this season code (momentum_monthly_index[0]..[6] MUST "
        f"follow this order — each is a relative index for that date):\n{timeline_lines}\n"
        f"Season window label: {win.range_label}\n\n"
        "You MUST use the web_search tool first (one or more queries) to gather current "
        "fashion/editorial/retail signals for this garment type and the business context "
        "(season, market, region, customer, ASP tier).\n"
        "Then respond with ONLY one JSON object matching the schema in your instructions. "
        "No markdown fences, no prose outside JSON.\n"
        "Ground evidence_summary in outlets, domains, or retailers surfaced by web search; "
        "do not invent specific headlines, handles, or SKUs that search did not support.\n"
    )

    body: dict = {
        "model": model,
        "instructions": FASHION_OPPORTUNITY_SYSTEM_PROMPT,
        "input": [
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": user_text},
                    {
                        "type": "input_image",
                        "image_url": f"data:{image_mime};base64,{image_b64}",
                        "detail": "high",
                    },
                ],
            }
        ],
        "tools": [_web_search_tool(ctx)],
        "tool_choice": "required",
        "include": ["web_search_call.action.sources"],
        # OpenAI does not allow json_object / structured JSON mode together with web_search.
        # Plain text + strong prompt; server parses JSON via extract_json_object.
        "text": {"format": {"type": "text"}},
        "max_output_tokens": 8192,
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        r = await client.post(
            OPENAI_RESPONSES_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json=body,
        )

    try:
        data = r.json()
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid OpenAI response ({r.status_code})") from e

    if r.is_error:
        msg = None
        if isinstance(data, dict):
            err = data.get("error")
            if isinstance(err, dict):
                msg = err.get("message")
        raise RuntimeError(msg or f"OpenAI request failed ({r.status_code})")

    raw = _extract_assistant_json_text(data)
    if not raw:
        raise RuntimeError("Empty response from model")

    try:
        return json.loads(extract_json_object(str(raw)))
    except json.JSONDecodeError as e:
        raise RuntimeError("Model returned invalid JSON") from e
