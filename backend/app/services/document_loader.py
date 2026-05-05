from __future__ import annotations

import os
from io import BytesIO
from typing import Any

from app.errors import EmptyDocument, FileTooLarge, UnsupportedFileType

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".rtf", ".html", ".htm", ".md"}


def _ext(filename: str) -> str:
    return os.path.splitext(filename or "")[1].lower()


def validate_upload(file_bytes: bytes, filename: str, max_mb: int) -> None:
    ext = _ext(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise UnsupportedFileType(
            f"Unsupported file type '{ext or 'unknown'}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
        )
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > max_mb:
        raise FileTooLarge(
            f"File is {size_mb:.1f} MB, exceeds the {max_mb} MB limit."
        )
    if len(file_bytes) == 0:
        raise EmptyDocument("Uploaded file is empty.")


def load_elements(file_bytes: bytes, filename: str) -> list[Any]:
    """Partition the uploaded file into Unstructured elements.

    For PDFs we try the fast strategy first, and fall back to hi_res when the
    fast strategy yields too few elements (often the case for scanned PDFs).
    """
    from unstructured.partition.auto import partition  # local import: heavy deps

    ext = _ext(filename)

    def _partition(strategy: str) -> list[Any]:
        return partition(
            file=BytesIO(file_bytes),
            metadata_filename=filename,
            strategy=strategy,
        )

    elements = _partition("fast")
    if ext == ".pdf" and len(elements) < 5:
        try:
            elements = _partition("hi_res")
        except Exception:
            pass  # keep the fast result if hi_res isn't available

    text_chars = sum(len(getattr(e, "text", "") or "") for e in elements)
    if not elements or text_chars < 50:
        raise EmptyDocument(
            "Could not extract enough text from the document. "
            "It may be a scanned image without OCR support."
        )
    return elements
