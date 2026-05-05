from __future__ import annotations

from typing import Any

# Field catalog drives the frontend FieldPicker. Each group corresponds to a
# top-level Candidate field (or dotted sub-field for contact.*). Options encode
# per-field configurability that recruiters can tweak.

FIELD_CATALOG: list[dict[str, Any]] = [
    {
        "key": "full_name",
        "label": "Full Name",
        "description": "The candidate's full legal name. Always recommended.",
        "default_enabled": True,
        "default_required": True,
        "options": [],
    },
    {
        "key": "headline",
        "label": "Headline",
        "description": "Short professional headline near the top of the resume.",
        "default_enabled": True,
        "options": [],
    },
    {
        "key": "summary",
        "label": "Summary / About",
        "description": "The 'About' or 'Profile' paragraph.",
        "default_enabled": True,
        "options": [],
    },
    {
        "key": "contact.email",
        "label": "Email",
        "description": "Primary contact email address.",
        "default_enabled": True,
        "default_required": True,
        "options": [],
    },
    {
        "key": "contact.phone",
        "label": "Phone",
        "description": "Primary contact phone number.",
        "default_enabled": True,
        "options": [],
    },
    {
        "key": "contact.location",
        "label": "Location",
        "description": "Current city/region/country.",
        "default_enabled": True,
        "options": [],
    },
    {
        "key": "contact.links",
        "label": "Profile Links",
        "description": "LinkedIn, GitHub, portfolio, etc.",
        "default_enabled": True,
        "options": [],
    },
    {
        "key": "skills",
        "label": "Skills",
        "description": "Distinct skills with optional category and years.",
        "default_enabled": True,
        "options": [
            {
                "key": "filter_categories",
                "type": "multi_select",
                "label": "Only include these categories",
                "choices": ["language", "framework", "tool", "soft", "other"],
                "default": [],
            },
            {
                "key": "max_items",
                "type": "number",
                "label": "Max items",
                "default": 50,
                "min": 1,
                "max": 200,
            },
        ],
    },
    {
        "key": "experience",
        "label": "Work Experience",
        "description": "Work experience entries, most recent first.",
        "default_enabled": True,
        "options": [
            {
                "key": "max_items",
                "type": "number",
                "label": "Max items",
                "default": 10,
                "min": 1,
                "max": 50,
            },
            {
                "key": "include_bullets",
                "type": "boolean",
                "label": "Include bullet points",
                "default": True,
            },
        ],
    },
    {
        "key": "education",
        "label": "Education",
        "description": "Education entries, most recent first.",
        "default_enabled": True,
        "options": [
            {
                "key": "max_items",
                "type": "number",
                "label": "Max items",
                "default": 10,
                "min": 1,
                "max": 30,
            },
        ],
    },
    {
        "key": "certifications",
        "label": "Certifications",
        "description": "Professional certifications and licenses.",
        "default_enabled": False,
        "options": [],
    },
    {
        "key": "projects",
        "label": "Projects",
        "description": "Personal or professional projects.",
        "default_enabled": False,
        "options": [
            {
                "key": "max_items",
                "type": "number",
                "label": "Max items",
                "default": 10,
                "min": 1,
                "max": 30,
            },
        ],
    },
    {
        "key": "languages",
        "label": "Spoken Languages",
        "description": "Spoken/written human languages and proficiency.",
        "default_enabled": False,
        "options": [],
    },
    {
        "key": "total_years_experience",
        "label": "Total Years of Experience",
        "description": "Computed by summing non-overlapping experience spans.",
        "default_enabled": True,
        "options": [],
    },
]


def get_catalog() -> list[dict[str, Any]]:
    return FIELD_CATALOG


CATALOG_KEYS: set[str] = {entry["key"] for entry in FIELD_CATALOG}
