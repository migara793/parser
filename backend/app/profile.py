from __future__ import annotations

import json
import re
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from app.catalog import CATALOG_KEYS
from app.errors import InvalidProfile

CustomFieldType = Literal["string", "number", "boolean", "string_list", "date"]

KEY_RE = re.compile(r"^[a-z][a-z0-9_]*$")


class CustomField(BaseModel):
    model_config = ConfigDict(extra="ignore")

    key: str = Field(..., min_length=1, max_length=64)
    type: CustomFieldType
    description: str = Field(..., min_length=1, max_length=500)
    required: bool = False

    @field_validator("key")
    @classmethod
    def _check_key(cls, v: str) -> str:
        if not KEY_RE.match(v):
            raise ValueError("key must match ^[a-z][a-z0-9_]*$")
        return v


class FieldConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    enabled: bool = True
    required: bool = False
    options: dict[str, Any] = Field(default_factory=dict)


class ExtractionProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = None
    fields: dict[str, FieldConfig] = Field(default_factory=dict)
    custom_fields: list[CustomField] = Field(default_factory=list)

    @field_validator("fields")
    @classmethod
    def _check_field_keys(cls, v: dict[str, FieldConfig]) -> dict[str, FieldConfig]:
        unknown = [k for k in v if k not in CATALOG_KEYS]
        if unknown:
            raise ValueError(f"Unknown catalog keys: {unknown}")
        return v

    @field_validator("custom_fields")
    @classmethod
    def _unique_custom_keys(cls, v: list[CustomField]) -> list[CustomField]:
        seen = set()
        for cf in v:
            if cf.key in seen:
                raise ValueError(f"Duplicate custom_field key: {cf.key}")
            seen.add(cf.key)
        return v

    def model_post_init(self, _ctx: Any) -> None:  # type: ignore[override]
        cfg = self.fields.get("full_name")
        if cfg is None or not cfg.enabled:
            raise ValueError("full_name must be enabled in the extraction profile.")


def parse_profile(raw: str | dict | ExtractionProfile) -> ExtractionProfile:
    if isinstance(raw, ExtractionProfile):
        return raw
    try:
        if isinstance(raw, str):
            data = json.loads(raw)
        else:
            data = raw
        return ExtractionProfile.model_validate(data)
    except (json.JSONDecodeError, ValidationError, ValueError) as e:
        raise InvalidProfile(f"Invalid extraction profile: {e}") from e
