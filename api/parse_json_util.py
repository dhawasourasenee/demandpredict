import re


def extract_json_object(text: str) -> str:
    trimmed = text.strip()
    fence = re.match(r"^```(?:json)?\s*([\s\S]*?)```$", trimmed, re.IGNORECASE)
    if fence:
        return fence.group(1).strip()
    start = trimmed.find("{")
    end = trimmed.rfind("}")
    if start >= 0 and end > start:
        return trimmed[start : end + 1]
    return trimmed
