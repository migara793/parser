import json
from types import SimpleNamespace

import pytest
from pydantic import BaseModel

from app.config import Settings
from app.errors import ExtractionFailed
from app.profile import ExtractionProfile, FieldConfig
from app.schema_builder import build_candidate_model
from app.services import extractor as extractor_module
from app.services.extractor import extract_candidate


def _settings():
    return Settings(google_api_key="fake-key")  # type: ignore[arg-type]


def _profile():
    return ExtractionProfile(
        fields={
            "full_name": FieldConfig(enabled=True, required=True),
            "contact.email": FieldConfig(enabled=True),
        }
    )


class _FakeAioModels:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls: list[dict] = []

    async def generate_content(self, *, model, contents, config):
        self.calls.append({"model": model, "contents": contents, "config": config})
        if not self._responses:
            raise RuntimeError("no more fake responses queued")
        return self._responses.pop(0)


class _FakeAio:
    def __init__(self, fake_models):
        self.models = fake_models


class _FakeClient:
    def __init__(self, fake_models):
        self.aio = _FakeAio(fake_models)


def _patch_genai(monkeypatch, fake_models):
    fake_genai = SimpleNamespace(Client=lambda api_key: _FakeClient(fake_models))
    fake_types = SimpleNamespace(GenerateContentConfig=lambda **kw: kw)
    monkeypatch.setattr("google.genai", fake_genai, raising=False)
    monkeypatch.setattr("google.genai.types", fake_types, raising=False)


@pytest.mark.asyncio
async def test_extract_candidate_happy_path(monkeypatch):
    Model = build_candidate_model(_profile())
    valid_instance = Model.model_validate(
        {"full_name": "Jane Doe", "contact": {"email": "jane@example.com"}}
    )
    response = SimpleNamespace(parsed=valid_instance, text=valid_instance.model_dump_json())
    fake_models = _FakeAioModels([response])
    _patch_genai(monkeypatch, fake_models)

    out = await extract_candidate(
        text="<resume>Jane Doe jane@example.com</resume>",
        model_cls=Model,
        profile_summary="- none",
        settings=_settings(),
    )
    assert isinstance(out, Model)
    assert out.full_name == "Jane Doe"  # type: ignore[attr-defined]
    assert len(fake_models.calls) == 1


@pytest.mark.asyncio
async def test_extract_candidate_retries_on_validation_error(monkeypatch):
    Model = build_candidate_model(_profile())
    bad = SimpleNamespace(parsed=None, text='{"not_full_name": 5}')
    valid_instance = Model.model_validate({"full_name": "Jane Doe"})
    good = SimpleNamespace(parsed=valid_instance, text=valid_instance.model_dump_json())
    fake_models = _FakeAioModels([bad, good])
    _patch_genai(monkeypatch, fake_models)

    out = await extract_candidate(
        text="resume", model_cls=Model, profile_summary="", settings=_settings()
    )
    assert isinstance(out, Model)
    assert len(fake_models.calls) == 2


@pytest.mark.asyncio
async def test_extract_candidate_raises_after_two_failures(monkeypatch):
    Model = build_candidate_model(_profile())
    bad1 = SimpleNamespace(parsed=None, text="not json")
    bad2 = SimpleNamespace(parsed=None, text='{"missing_full_name": true}')
    fake_models = _FakeAioModels([bad1, bad2])
    _patch_genai(monkeypatch, fake_models)

    with pytest.raises(ExtractionFailed):
        await extract_candidate(
            text="resume",
            model_cls=Model,
            profile_summary="",
            settings=_settings(),
        )


@pytest.mark.asyncio
async def test_extract_candidate_wraps_provider_exceptions(monkeypatch):
    Model = build_candidate_model(_profile())

    class _Boom:
        async def generate_content(self, **kw):
            raise RuntimeError("rate limited")

    fake_genai = SimpleNamespace(
        Client=lambda api_key: SimpleNamespace(aio=SimpleNamespace(models=_Boom()))
    )
    fake_types = SimpleNamespace(GenerateContentConfig=lambda **kw: kw)
    monkeypatch.setattr("google.genai", fake_genai, raising=False)
    monkeypatch.setattr("google.genai.types", fake_types, raising=False)

    with pytest.raises(ExtractionFailed) as ei:
        await extract_candidate(
            text="resume",
            model_cls=Model,
            profile_summary="",
            settings=_settings(),
        )
    assert "rate limited" in (ei.value.provider_error or "")
