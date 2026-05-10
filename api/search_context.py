from __future__ import annotations

import os
from typing import Any

import httpx

from api.schemas import BusinessContext


async def fetch_live_search_context(ctx: BusinessContext) -> str:
    """
    Optional Tavily web search. When TAVILY_API_KEY is set, retrieves recent
    snippets for the buyer context so the model can ground evidence in real URLs/titles.
    """
    key = os.environ.get("TAVILY_API_KEY", "").strip()
    if not key:
        return ""

    query = (
        f"{ctx.season} {ctx.market} fashion trends {ctx.target_customer} "
        f"{ctx.region} retail assortments mass market womenswear menswear 2026"
    )

    payload: dict[str, Any] = {
        "api_key": key,
        "query": query,
        "search_depth": "advanced",
        "max_results": 10,
        "include_answer": True,
        "include_raw_content": False,
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            r = await client.post("https://api.tavily.com/search", json=payload)
            r.raise_for_status()
            data = r.json()
    except (httpx.HTTPError, ValueError):
        return ""

    lines: list[str] = []
    ans = data.get("answer")
    if isinstance(ans, str) and ans.strip():
        lines.append(f"Summary: {ans.strip()}")

    for i, item in enumerate(data.get("results") or [], start=1):
        if not isinstance(item, dict):
            continue
        title = (item.get("title") or "").strip()
        url = (item.get("url") or "").strip()
        content = (item.get("content") or "").strip()
        if not title and not content:
            continue
        src = f"{title} ({url})" if url else title
        snippet = content[:900] + ("…" if len(content) > 900 else "")
        lines.append(f"{i}. {src}\n   {snippet}")

    if not lines:
        return ""

    return "\n\n".join(lines)
