from __future__ import annotations

import logging
import time
import uuid

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
    request_id = uuid.uuid4().hex[:8]
    t0 = time.perf_counter()
    filename = file.filename or "<unnamed>"
    logger.info("[%s] /parse received — file=%s content_type=%s", request_id, filename, file.content_type)

    profile_obj = parse_profile(profile)
    enabled_keys = [k for k, v in profile_obj.fields.items() if v.enabled]
    logger.info(
        "[%s] profile parsed — %d enabled fields, %d custom fields (custom_keys=%s)",
        request_id,
        len(enabled_keys),
        len(profile_obj.custom_fields),
        [cf.key for cf in profile_obj.custom_fields],
    )

    file_bytes = await file.read()
    size_kb = len(file_bytes) / 1024
    logger.info("[%s] file read — %.1f KB", request_id, size_kb)
    validate_upload(file_bytes, filename, settings.max_file_mb)

    t_load = time.perf_counter()
    elements = load_elements(file_bytes, filename)
    text = elements_to_text(elements)
    logger.info(
        "[%s] document partitioned — %d elements, %d chars, %.2fs",
        request_id,
        len(elements),
        len(text),
        time.perf_counter() - t_load,
    )

    model_cls = build_candidate_model(profile_obj)
    profile_summary = describe_profile_for_system_prompt(profile_obj)
    logger.debug("[%s] schema fields=%s", request_id, list(model_cls.model_fields.keys()))

    logger.info(
        "[%s] calling Gemini — model=%s, schema=%s, system_prompt_chars=%d",
        request_id,
        settings.gemini_model,
        model_cls.__name__,
        len(profile_summary),
    )
    t_llm = time.perf_counter()
    candidate = await extract_candidate(
        text=text,
        model_cls=model_cls,
        profile_summary=profile_summary,
        settings=settings,
        request_id=request_id,
    )
    logger.info(
        "[%s] extraction complete — %.2fs",
        request_id,
        time.perf_counter() - t_llm,
    )

    candidate_dict = candidate.model_dump()
    if "raw_text_excerpt" in model_cls.model_fields:
        candidate_dict["raw_text_excerpt"] = excerpt(text)

    name_preview = candidate_dict.get("full_name") or candidate_dict.get("name") or "<no name>"
    email_preview = candidate_dict.get("email") or "<no email>"
    populated = sum(
        1 for v in candidate_dict.values()
        if v not in (None, "", [], {})
    )
    logger.info(
        "[%s] /parse done — name=%r email=%r populated=%d/%d total=%.2fs",
        request_id,
        name_preview,
        email_preview,
        populated,
        len(candidate_dict),
        time.perf_counter() - t0,
    )

    return {
        "candidate": candidate_dict,
        "meta": {
            "filename": filename,
            "elements": len(elements),
            "chars": len(text),
            "model": settings.gemini_model,
            "provider": "google-gemini",
            "fields_requested": enabled_keys,
            "custom_fields": [cf.key for cf in profile_obj.custom_fields],
            "request_id": request_id,
        },
    }
