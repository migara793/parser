from __future__ import annotations

import logging
import time
from typing import Any, Optional

from pydantic import BaseModel, ValidationError

from app.config import Settings
from app.errors import ExtractionFailed

logger = logging.getLogger(__name__)


SYSTEM_PROMPT_BASE = """You are a precise resume/CV information extractor.

Rules — non-negotiable:
1. Extract ONLY information supported by the resume text. NEVER invent details
   that are not present.
2. Output strictly valid JSON conforming to the provided schema. No markdown,
   no code fences, no commentary outside the JSON.
3. Normalize dates to "YYYY-MM". Use null when a date is unknown.
4. Set experience[].current = true when the end date is "Present", "Current",
   "Now", or otherwise ongoing.
5. If `total_years_experience` is present in the schema, compute it by summing
   non-overlapping experience spans, rounded to one decimal place.
6. Honor every field description verbatim — they encode caps, category
   filters, and recruiter-defined custom fields.
7. For absent optional fields: emit null (or an empty list for list fields).
   For required fields with no clear evidence: emit a best-effort value, never
   a fabricated one.
8. Preserve the original wording of bullet points, but strip leading bullet
   glyphs (•, -, *, etc.).
"""


def _extract_json_text(response: Any) -> Optional[str]:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text
    candidates = getattr(response, "candidates", None) or []
    for cand in candidates:
        content = getattr(cand, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", None) or []:
            t = getattr(part, "text", None)
            if isinstance(t, str) and t.strip():
                return t
    return None


def _log_usage(request_id: str, attempt: str, response: Any) -> None:
    usage = getattr(response, "usage_metadata", None)
    if not usage:
        return
    prompt_tok = getattr(usage, "prompt_token_count", None)
    out_tok = getattr(usage, "candidates_token_count", None)
    total = getattr(usage, "total_token_count", None)
    finish = None
    candidates = getattr(response, "candidates", None) or []
    if candidates:
        finish = getattr(candidates[0], "finish_reason", None)
    logger.info(
        "[%s] gemini %s — prompt_tokens=%s output_tokens=%s total=%s finish=%s",
        request_id,
        attempt,
        prompt_tok,
        out_tok,
        total,
        finish,
    )


async def extract_candidate(
    text: str,
    model_cls: type[BaseModel],
    profile_summary: str,
    settings: Settings,
    request_id: str = "-",
) -> BaseModel:
    """Run Gemini structured-output extraction. Retry once on validation error."""

    # Local import: keeps unit tests fast and lets us monkeypatch the SDK.
    from google import genai
    from google.genai import types

    api_key = settings.google_api_key.get_secret_value()
    if not api_key:
        raise ExtractionFailed("GOOGLE_API_KEY is not configured.")

    client = genai.Client(api_key=api_key)

    system_instruction = (
        SYSTEM_PROMPT_BASE
        + "\n\nRecruiter constraints:\n"
        + (profile_summary or "- No extra constraints.")
    )

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=model_cls,
        system_instruction=system_instruction,
        temperature=0.1,
        max_output_tokens=4096,
    )

    user_content = f"<resume>\n{text}\n</resume>"
    logger.info(
        "[%s] gemini request — model=%s, resume_chars=%d, system_chars=%d, schema=%s",
        request_id,
        settings.gemini_model,
        len(text),
        len(system_instruction),
        model_cls.__name__,
    )

    async def _call(contents: Any, attempt: str) -> Any:
        t0 = time.perf_counter()
        try:
            response = await client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=config,
            )
        except Exception as e:
            logger.error(
                "[%s] gemini %s failed after %.2fs — %s: %s",
                request_id,
                attempt,
                time.perf_counter() - t0,
                type(e).__name__,
                e,
            )
            raise ExtractionFailed(
                "Gemini API call failed.",
                provider_error=f"{type(e).__name__}: {e}",
            ) from e
        logger.info(
            "[%s] gemini %s ok — %.2fs",
            request_id,
            attempt,
            time.perf_counter() - t0,
        )
        _log_usage(request_id, attempt, response)
        return response

    def _parse(response: Any) -> BaseModel:
        parsed = getattr(response, "parsed", None)
        if isinstance(parsed, model_cls):
            return parsed
        json_text = _extract_json_text(response)
        if not json_text:
            raise ValidationError.from_exception_data(  # pragma: no cover
                title=model_cls.__name__,
                line_errors=[],
            )
        return model_cls.model_validate_json(json_text)

    response = await _call(user_content, "attempt-1")
    try:
        result = _parse(response)
        logger.info("[%s] gemini attempt-1 parsed cleanly", request_id)
        return result
    except (ValidationError, ValueError) as first_error:
        logger.warning(
            "[%s] gemini attempt-1 failed validation, retrying — %s",
            request_id,
            first_error,
        )

        retry_contents = [
            {"role": "user", "parts": [{"text": user_content}]},
            {
                "role": "model",
                "parts": [
                    {"text": _extract_json_text(response) or "{}"},
                ],
            },
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            "Your previous output failed validation: "
                            f"{first_error}. Re-emit ONLY valid JSON conforming "
                            "to the schema. No prose, no code fences."
                        )
                    }
                ],
            },
        ]
        retry_response = await _call(retry_contents, "attempt-2")
        try:
            result = _parse(retry_response)
            logger.info("[%s] gemini attempt-2 parsed cleanly", request_id)
            return result
        except (ValidationError, ValueError) as second_error:
            logger.error(
                "[%s] gemini attempt-2 also failed validation — %s",
                request_id,
                second_error,
            )
            raise ExtractionFailed(
                "Model output failed schema validation after retry.",
                provider_error=str(second_error),
            ) from second_error
