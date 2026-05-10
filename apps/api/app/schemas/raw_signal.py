from typing import List, Optional

from pydantic import BaseModel


class RawSignal(BaseModel):
    source_type: str
    title: str
    url: str
    snippet: str
    published_at: Optional[str] = None
    trend_keywords: Optional[List[str]] = None
    relevance_score: Optional[float] = None
