from __future__ import annotations

import json
import os

import httpx

from api.parse_json_util import extract_json_object
from api.schemas import BusinessContext
from api.system_prompt import FASHION_OPPORTUNITY_SYSTEM_PROMPT

OPENAI_URL = "https://api.openai.com/v1/chat/completions"


async def call_openai_vision(
    image_b64: str,
    image_mime: str,
    ctx: BusinessContext,
) -> dict:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set on the server")

    model = (os.environ.get("OPENAI_MODEL") or "gpt-4o").strip() or "gpt-4o"

    user_text = (
        f"Business context (JSON):\n{ctx.model_dump_json(indent=2)}\n\n"
        "Analyze the attached garment image. Return ONLY one JSON object matching the schema "
        "from your instructions. No markdown, no prose outside JSON."
    )

    body = {
        "model": model,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": FASHION_OPPORTUNITY_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{image_mime};base64,{image_b64}",
                            "detail": "high",
                        },
                    },
                ],
            },
        ],
        "max_tokens": 4096,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            OPENAI_URL,
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

    choices = data.get("choices") if isinstance(data, dict) else None
    raw = None
    if isinstance(choices, list) and choices:
        msg = choices[0].get("message") if isinstance(choices[0], dict) else None
        if isinstance(msg, dict):
            raw = msg.get("content")
    if not raw:
        raise RuntimeError("Empty response from model")

    try:
        return json.loads(extract_json_object(str(raw)))
    except json.JSONDecodeError as e:
        raise RuntimeError("Model returned invalid JSON") from e
