from pathlib import Path

import pytest

from app.errors import FileTooLarge, UnsupportedFileType
from app.services.document_loader import load_elements, validate_upload

FIXTURE = Path(__file__).parent / "fixtures" / "sample_cv.txt"


def test_validate_upload_rejects_oversize():
    with pytest.raises(FileTooLarge):
        validate_upload(b"x" * (3 * 1024 * 1024), "cv.txt", max_mb=2)


def test_validate_upload_rejects_unknown_extension():
    with pytest.raises(UnsupportedFileType):
        validate_upload(b"hello", "cv.exe", max_mb=10)


def test_validate_upload_accepts_txt():
    validate_upload(b"hello world", "cv.txt", max_mb=10)


def test_load_elements_returns_text_for_sample():
    data = FIXTURE.read_bytes()
    elements = load_elements(data, FIXTURE.name)
    assert len(elements) > 0
    joined = " ".join((getattr(e, "text", "") or "") for e in elements)
    assert "Jane" in joined
