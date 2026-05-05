from __future__ import annotations

import re
from typing import Any

_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
_MULTI_NL_RE = re.compile(r"\n{3,}")


def _category(el: Any) -> str:
    return (
        getattr(el, "category", None)
        or el.__class__.__name__
        or "Text"
    )


def elements_to_text(elements: list[Any]) -> str:
    parts: list[str] = []
    for el in elements:
        text = (getattr(el, "text", "") or "").strip()
        if not text:
            # Tables sometimes carry HTML in metadata even if .text is empty.
            md = getattr(el, "metadata", None)
            html = getattr(md, "text_as_html", None) if md else None
            if html:
                parts.append(html)
            continue
        cat = _category(el)
        if cat in ("Title", "Header"):
            parts.append(f"\n\n## {text}\n")
        elif cat in ("ListItem",):
            parts.append(f"- {text}")
        elif cat == "Table":
            md = getattr(el, "metadata", None)
            html = getattr(md, "text_as_html", None) if md else None
            parts.append(html or text)
        else:
            parts.append(text)

    raw = "\n".join(parts)
    raw = _CONTROL_RE.sub("", raw)
    raw = _MULTI_NL_RE.sub("\n\n", raw)
    return raw.strip()


def excerpt(text: str, n: int = 500) -> str:
    if len(text) <= n:
        return text
    cut = text[:n]
    sp = cut.rfind(" ")
    if sp > n * 0.6:
        cut = cut[:sp]
    return cut.rstrip() + "…"
