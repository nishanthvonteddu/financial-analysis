from src.services.parsing.bank_templates import NON_GENERIC_TEMPLATES


def _normalize(value: str) -> str:
    return " ".join(value.strip().lower().replace("_", " ").split())


def _score_headers(normalized_headers: set[str], *, header_sets: tuple[frozenset[str], ...]) -> int:
    best_score = 0
    for header_set in header_sets:
        overlap = len(normalized_headers.intersection(header_set))
        if header_set.issubset(normalized_headers):
            return 100 + overlap
        best_score = max(best_score, overlap)
    return best_score if best_score >= 3 else 0


def detect_bank_format(*, pdf_text: str | None = None, headers: list[str] | None = None) -> str:
    normalized_headers = {_normalize(header) for header in headers or [] if header}
    normalized_text = _normalize(pdf_text or "")

    best_match = "generic"
    best_score = 0

    for template in NON_GENERIC_TEMPLATES:
        score = _score_headers(normalized_headers, header_sets=template.header_sets)
        keyword_hits = sum(1 for marker in template.header_keywords if marker in normalized_headers)
        if keyword_hits >= 3:
            score += keyword_hits * 10
        score += sum(1 for marker in template.text_markers if marker in normalized_text) * 20

        if score > best_score:
            best_match = template.slug
            best_score = score

    return best_match if best_score > 0 else "generic"
