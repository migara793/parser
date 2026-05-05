from __future__ import annotations

import logging

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.catalog import get_catalog
from app.config import get_settings
from app.errors import register_exception_handlers
from app.profile import parse_profile
from app.schema_builder import build_candidate_model, describe_profile_for_system_prompt
from app.services.document_loader import load_elements, validate_upload
from app.services.extractor import extract_candidate
from app.services.normalizer import elements_to_text, excerpt

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("parser")


app = FastAPI(
    title="Resume Parser",
    description="Extract structured candidate data from resumes using Gemini.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "model": settings.gemini_model,
        "provider": "google-gemini",
    }


@app.get("/fields")
async def fields() -> list[dict]:
    return get_catalog()


@app.post("/parse")
async def parse(
    file: UploadFile = File(...),
    profile: str = Form(...),
):
    profile_obj = parse_profile(profile)

    file_bytes = await file.read()
    validate_upload(file_bytes, file.filename or "", settings.max_file_mb)

    elements = load_elements(file_bytes, file.filename or "")
    text = elements_to_text(elements)

    model_cls = build_candidate_model(profile_obj)
    profile_summary = describe_profile_for_system_prompt(profile_obj)

    logger.info(
        "Parsing %s — %d elements, %d chars, %d custom fields",
        file.filename,
        len(elements),
        len(text),
        len(profile_obj.custom_fields),
    )

    candidate = await extract_candidate(
        text=text,
        model_cls=model_cls,
        profile_summary=profile_summary,
        settings=settings,
    )

    candidate_dict = candidate.model_dump()
    if "raw_text_excerpt" in model_cls.model_fields:
        candidate_dict["raw_text_excerpt"] = excerpt(text)

    enabled_keys = [k for k, v in profile_obj.fields.items() if v.enabled]

    return {
        "candidate": candidate_dict,
        "meta": {
            "filename": file.filename,
            "elements": len(elements),
            "chars": len(text),
            "model": settings.gemini_model,
            "provider": "google-gemini",
            "fields_requested": enabled_keys,
            "custom_fields": [cf.key for cf in profile_obj.custom_fields],
        },
    }
