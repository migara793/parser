import json
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.routes import app
from app.services import extractor as extractor_module

FIXTURE = Path(__file__).parent / "fixtures" / "sample_cv.txt"


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["provider"] == "google-gemini"


@pytest.mark.asyncio
async def test_fields_catalog():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.get("/fields")
    assert r.status_code == 200
    keys = [f["key"] for f in r.json()]
    assert "full_name" in keys
    assert "experience" in keys


@pytest.mark.asyncio
async def test_parse_endpoint_with_stubbed_extractor(monkeypatch):
    async def fake_extract(text, model_cls, profile_summary, settings):
        # Ensure dynamic model only contains requested top-level keys
        keys = set(model_cls.model_fields.keys())
        assert "full_name" in keys
        assert "education" not in keys  # not enabled in profile below
        return model_cls.model_validate(
            {"full_name": "Jane Doe", "contact": {"email": "jane@example.com"}}
        )

    monkeypatch.setattr(
        "app.api.routes.extract_candidate", fake_extract, raising=True
    )

    profile = {
        "fields": {
            "full_name": {"enabled": True, "required": True},
            "contact.email": {"enabled": True, "required": True},
        },
        "custom_fields": [],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.post(
            "/parse",
            files={"file": ("sample_cv.txt", FIXTURE.read_bytes(), "text/plain")},
            data={"profile": json.dumps(profile)},
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["candidate"]["full_name"] == "Jane Doe"
    assert "education" not in body["candidate"]
    assert body["meta"]["provider"] == "google-gemini"
    assert "full_name" in body["meta"]["fields_requested"]


@pytest.mark.asyncio
async def test_parse_endpoint_rejects_profile_without_full_name():
    profile = {"fields": {"headline": {"enabled": True}}, "custom_fields": []}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.post(
            "/parse",
            files={"file": ("sample_cv.txt", FIXTURE.read_bytes(), "text/plain")},
            data={"profile": json.dumps(profile)},
        )
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid_profile"
