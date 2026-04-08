from __future__ import annotations

from io import BytesIO

import pdfplumber

from src.core.logging import get_logger
from src.services.parsing.template_parsers import parse_pdf_text
from src.services.parsing.types import ExtractionResult

logger = get_logger(__name__)


class ScannedPdfError(ValueError):
    pass


def extract_pdf_text(content: bytes) -> str:
    logger.info("parsing.pdf.started", file_size=len(content))
    with pdfplumber.open(BytesIO(content)) as pdf:
        page_text = [page.extract_text() or "" for page in pdf.pages]

    extracted = "\n".join(text.strip() for text in page_text if text.strip()).strip()
    if not extracted:
        logger.info("parsing.pdf.scanned_detected")
        raise ScannedPdfError("PDF has no text layer and appears to be scanned.")

    logger.info("parsing.pdf.text_extracted", page_count=len(page_text), text_length=len(extracted))
    return extracted


def extract_pdf_transactions(content: bytes) -> ExtractionResult:
    text = extract_pdf_text(content)
    return parse_pdf_text(text)
