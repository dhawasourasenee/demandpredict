import logging

logger = logging.getLogger(__name__)


def build_pdf_placeholder(report_id: str) -> bytes:
    """Return minimal PDF bytes placeholder until full report layout ships."""
    logger.info("pdf_placeholder report_id=%s", report_id)
    return b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
