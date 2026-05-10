import logging
import sys
from typing import Any

from app.core.request_context import get_request_id


class ContextRequestIdFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        record.request_id = get_request_id()
        return super().format(record)


def configure_logging(level: str) -> None:
    root = logging.getLogger()
    root.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        ContextRequestIdFormatter("%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s")
    )
    root.addHandler(handler)
    root.setLevel(level.upper())


def log_extra() -> dict[str, Any]:
    return {}
