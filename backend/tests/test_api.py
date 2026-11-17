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
    async def fake_extract(text, model_cls, profile_summary, settings, request_id="-"):
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


@pytest.mark.asyncio
async def test_parse_and_shortlist_pipeline(monkeypatch):
    async def fake_extract(text, model_cls, profile_summary, settings, request_id="-"):
        return model_cls.model_validate(
            {"full_name": "Jane Doe", "contact": {"email": "jane@example.com"}}
        )

    monkeypatch.setattr("app.api.routes.extract_candidate", fake_extract, raising=True)

    class FakeResponse:
        status_code = 200

        @staticmethod
        def json():
            return {
                "job_id": "job-123",
                "candidate_name": "Jane Doe",
                "score": 0.82,
                "breakdown": {
                    "semantic_similarity": 0.8,
                    "experience_match": 1.0,
                    "skills_match": 1.0,
                    "education_match": 1.0,
                    "total_score": 0.82,
                    "hard_requirements_met": True,
                    "hard_failures": [],
                },
                "reasoning": "Candidate evaluated.",
                "status": "Shortlisted",
            }

    class FakeClient:
        def __init__(self, **kwargs):
            self.kwargs = kwargs
            self.payload = None

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, path, json):
            assert path == "/evaluate"
            self.payload = json
            return FakeResponse()

    clients = []

    def fake_client(**kwargs):
        client = FakeClient(**kwargs)
        clients.append(client)
        return client

    monkeypatch.setattr("app.api.routes.httpx.AsyncClient", fake_client)

    profile = {
        "fields": {
            "full_name": {"enabled": True, "required": True},
            "contact.email": {"enabled": True, "required": True},
        },
        "custom_fields": [],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.post(
            "/parse-and-shortlist",
            files={"file": ("sample_cv.txt", FIXTURE.read_bytes(), "text/plain")},
            data={
                "profile": json.dumps(profile),
                "job_id": "job-123",
                "save_to_pool": "true",
            },
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["pipeline"]["status"] == "completed"
    assert body["parse"]["candidate"]["full_name"] == "Jane Doe"
    assert body["evaluation"]["status"] == "Shortlisted"
    assert clients[0].payload["job_id"] == "job-123"
    assert clients[0].payload["save_to_pool"] is True
