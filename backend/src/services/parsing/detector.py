def _normalize(value: str) -> str:
    return " ".join(value.strip().lower().replace("_", " ").split())


def detect_bank_format(*, pdf_text: str | None = None, headers: list[str] | None = None) -> str:
    normalized_headers = {_normalize(header) for header in headers or [] if header}
    normalized_text = _normalize(pdf_text or "")

    chase_header_markers = {
        "posting date",
        "transaction date",
        "details",
        "description",
        "amount",
    }
    if {"posting date", "details", "amount"}.issubset(normalized_headers):
        return "chase"
    if len(chase_header_markers.intersection(normalized_headers)) >= 4:
        return "chase"
    if "chase" in normalized_text or "jpmorgan" in normalized_text:
        return "chase"

    return "generic"
