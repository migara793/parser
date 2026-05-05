from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, create_model

from app.profile import CustomField, ExtractionProfile
from app.schemas import (
    Candidate,
    Certification,
    Contact,
    Education,
    Experience,
    Language,
    Link,
    Project,
    Skill,
)

_TYPE_MAP_PYTHON = {
    "string": str,
    "number": float,
    "boolean": bool,
    "string_list": list[str],
    "date": str,
}

_TYPE_HINT_DESCRIPTION = {
    "date": " Format: YYYY-MM-DD.",
}


CONTACT_SUBFIELDS = {
    "contact.email": "email",
    "contact.phone": "phone",
    "contact.location": "location",
    "contact.links": "links",
}


def _build_dynamic_contact(profile: ExtractionProfile) -> Optional[type[BaseModel]]:
    """Rebuild Contact with only enabled sub-fields. Returns None if no contact sub-field is enabled."""
    base_fields = Contact.model_fields
    selected: dict[str, tuple[Any, Any]] = {}
    for catalog_key, attr in CONTACT_SUBFIELDS.items():
        cfg = profile.fields.get(catalog_key)
        if not cfg or not cfg.enabled:
            continue
        base = base_fields[attr]
        annotation = base.annotation
        default = base.default if base.default is not None else (
            [] if attr == "links" else None
        )
        description = base.description or ""
        selected[attr] = (
            annotation,
            Field(default=default, description=description),
        )
    if not selected:
        return None
    return create_model(
        "DynamicContact",
        __base__=BaseModel,
        __config__=ConfigDict(extra="ignore"),
        **selected,
    )


def _augment_skills_description(profile: ExtractionProfile, base_desc: str) -> str:
    cfg = profile.fields.get("skills")
    if not cfg:
        return base_desc
    extras: list[str] = []
    cats = cfg.options.get("filter_categories") or []
    if cats:
        extras.append(
            "Only include skills whose category is one of: " + ", ".join(cats) + "."
        )
    max_items = cfg.options.get("max_items")
    if isinstance(max_items, int):
        extras.append(f"Include at most {max_items} items.")
    return (base_desc + " " + " ".join(extras)).strip()


def _augment_experience_description(profile: ExtractionProfile, base_desc: str) -> str:
    cfg = profile.fields.get("experience")
    if not cfg:
        return base_desc
    extras: list[str] = []
    max_items = cfg.options.get("max_items")
    if isinstance(max_items, int):
        extras.append(f"Include at most {max_items} entries, most recent first.")
    if cfg.options.get("include_bullets") is False:
        extras.append("Do not populate the bullets field; leave it as an empty list.")
    return (base_desc + " " + " ".join(extras)).strip()


def _augment_max_items(profile: ExtractionProfile, key: str, base_desc: str) -> str:
    cfg = profile.fields.get(key)
    if not cfg:
        return base_desc
    max_items = cfg.options.get("max_items")
    if isinstance(max_items, int):
        return (base_desc + f" Include at most {max_items} entries.").strip()
    return base_desc


_TOP_LEVEL_NESTED_TYPES: dict[str, type[BaseModel]] = {
    "skills": Skill,
    "experience": Experience,
    "education": Education,
    "certifications": Certification,
    "projects": Project,
    "languages": Language,
}


def _custom_field_pyfield(cf: CustomField) -> tuple[Any, Any]:
    base_type = _TYPE_MAP_PYTHON[cf.type]
    desc = cf.description + _TYPE_HINT_DESCRIPTION.get(cf.type, "")
    if cf.required:
        return (base_type, Field(..., description=desc))
    annotation = Optional[base_type]
    default = [] if cf.type == "string_list" else None
    return (annotation, Field(default=default, description=desc))


def build_candidate_model(profile: ExtractionProfile) -> type[BaseModel]:
    """Construct a DynamicCandidate Pydantic model reflecting the recruiter's profile."""

    base_fields = Candidate.model_fields
    selected: dict[str, tuple[Any, Any]] = {}

    def add(name: str, annotation: Any, description: str, *, required: bool, default: Any):
        if required:
            selected[name] = (annotation, Field(..., description=description))
        else:
            selected[name] = (annotation, Field(default=default, description=description))

    # full_name (always required)
    fn_cfg = profile.fields["full_name"]
    add(
        "full_name",
        str,
        base_fields["full_name"].description or "",
        required=fn_cfg.required or True,
        default=...,
    )

    # Simple top-level scalar fields
    for key in ("headline", "summary", "total_years_experience", "raw_text_excerpt"):
        cfg = profile.fields.get(key)
        if not cfg or not cfg.enabled:
            continue
        base = base_fields[key]
        annotation = base.annotation
        desc = base.description or ""
        if cfg.required:
            add(key, annotation, desc, required=True, default=...)
        else:
            add(key, annotation, desc, required=False, default=None)

    # Contact (dynamic sub-model)
    dynamic_contact = _build_dynamic_contact(profile)
    if dynamic_contact is not None:
        add(
            "contact",
            dynamic_contact,
            base_fields["contact"].description or "Contact details.",
            required=False,
            default=None,
        )

    # List fields with descriptions augmented from options
    list_aug = {
        "skills": _augment_skills_description,
        "experience": _augment_experience_description,
        "education": lambda p, d: _augment_max_items(p, "education", d),
        "certifications": lambda p, d: _augment_max_items(p, "certifications", d),
        "projects": lambda p, d: _augment_max_items(p, "projects", d),
        "languages": lambda p, d: d,
    }
    for key, item_model in _TOP_LEVEL_NESTED_TYPES.items():
        cfg = profile.fields.get(key)
        if not cfg or not cfg.enabled:
            continue
        base = base_fields[key]
        base_desc = base.description or ""
        desc = list_aug[key](profile, base_desc)
        annotation = list[item_model]  # type: ignore[valid-type]
        add(key, annotation, desc, required=False, default=[])

    # Custom fields
    for cf in profile.custom_fields:
        selected[cf.key] = _custom_field_pyfield(cf)

    return create_model(
        "DynamicCandidate",
        __base__=BaseModel,
        __config__=ConfigDict(extra="ignore"),
        **selected,
    )


def describe_profile_for_system_prompt(profile: ExtractionProfile) -> str:
    lines: list[str] = []
    skills_cfg = profile.fields.get("skills")
    if skills_cfg and skills_cfg.enabled:
        cats = skills_cfg.options.get("filter_categories") or []
        if cats:
            lines.append(
                f"- Skills: include ONLY skills whose category is one of: {', '.join(cats)}."
            )
        mi = skills_cfg.options.get("max_items")
        if isinstance(mi, int):
            lines.append(f"- Skills: at most {mi} entries.")

    exp_cfg = profile.fields.get("experience")
    if exp_cfg and exp_cfg.enabled:
        mi = exp_cfg.options.get("max_items")
        if isinstance(mi, int):
            lines.append(f"- Experience: at most {mi} entries, most recent first.")
        if exp_cfg.options.get("include_bullets") is False:
            lines.append("- Experience: do NOT include bullet points; bullets must be an empty list.")

    for k in ("education", "certifications", "projects"):
        cfg = profile.fields.get(k)
        if cfg and cfg.enabled:
            mi = cfg.options.get("max_items")
            if isinstance(mi, int):
                lines.append(f"- {k.capitalize()}: at most {mi} entries.")

    if profile.custom_fields:
        lines.append("- Custom fields requested by the recruiter:")
        for cf in profile.custom_fields:
            req = " [required]" if cf.required else ""
            lines.append(f'  * "{cf.key}" ({cf.type}){req}: {cf.description}')

    return "\n".join(lines) if lines else "- No extra constraints."


__all__ = [
    "build_candidate_model",
    "describe_profile_for_system_prompt",
    "Link",  # re-exported for convenience
]
