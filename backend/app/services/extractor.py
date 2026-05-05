from __future__ import annotations

import logging
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


async def extract_candidate(
    text: str,
    model_cls: type[BaseModel],
    profile_summary: str,
    settings: Settings,
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

    async def _call(contents: Any) -> Any:
        try:
            return await client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=config,
            )
        except Exception as e:
            raise ExtractionFailed(
                "Gemini API call failed.",
                provider_error=f"{type(e).__name__}: {e}",
            ) from e

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

    response = await _call(user_content)
    try:
        return _parse(response)
    except (ValidationError, ValueError) as first_error:
        logger.warning("First extraction attempt failed validation: %s", first_error)

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
        retry_response = await _call(retry_contents)
        try:
            return _parse(retry_response)
        except (ValidationError, ValueError) as second_error:
            raise ExtractionFailed(
                "Model output failed schema validation after retry.",
                provider_error=str(second_error),
            ) from second_error
