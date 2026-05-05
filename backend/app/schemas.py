from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ProficiencyLevel = Literal["basic", "conversational", "professional", "fluent", "native"]
SkillCategory = Literal["language", "framework", "tool", "soft", "other"]


class Link(BaseModel):
    model_config = ConfigDict(extra="ignore")

    label: Optional[str] = Field(
        default=None,
        description="Short label for the link (e.g. 'LinkedIn', 'GitHub', 'Portfolio').",
    )
    url: str = Field(
        ...,
        description="The full URL as it appears in the resume. Keep the original scheme.",
    )


class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")

    email: Optional[str] = Field(
        default=None,
        description="Primary contact email address. Lowercased. Null if not present.",
    )
    phone: Optional[str] = Field(
        default=None,
        description="Primary contact phone number, in international format if visible.",
    )
    location: Optional[str] = Field(
        default=None,
        description="Current city/region/country mentioned near the candidate's name or summary.",
    )
    links: list[Link] = Field(
        default_factory=list,
        description="External profile or portfolio links (LinkedIn, GitHub, personal site, etc.).",
    )


class Skill(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., description="Skill name as written in the resume (e.g. 'Python').")
    category: Optional[SkillCategory] = Field(
        default=None,
        description=(
            "One of: language, framework, tool, soft, other. Choose the closest fit "
            "based on the skill kind."
        ),
    )
    years: Optional[float] = Field(
        default=None,
        description="Approximate years of experience with this skill if explicitly stated.",
    )


class Experience(BaseModel):
    model_config = ConfigDict(extra="ignore")

    company: str = Field(..., description="Company or organization name.")
    title: str = Field(..., description="Job title held at the company.")
    start_date: Optional[str] = Field(
        default=None,
        description="Start date in YYYY-MM format. Null if not stated.",
    )
    end_date: Optional[str] = Field(
        default=None,
        description="End date in YYYY-MM format. Null if ongoing or not stated.",
    )
    current: bool = Field(
        default=False,
        description="True when the role is described as 'present', 'current', or ongoing.",
    )
    location: Optional[str] = Field(
        default=None,
        description="City/country of the role. Null if remote or not stated.",
    )
    bullets: list[str] = Field(
        default_factory=list,
        description=(
            "Achievement/responsibility bullets, one per list item. Strip leading bullet "
            "glyphs but preserve original wording."
        ),
    )


class Education(BaseModel):
    model_config = ConfigDict(extra="ignore")

    institution: str = Field(..., description="School, college, or university name.")
    degree: Optional[str] = Field(
        default=None, description="Degree type (e.g. 'B.Sc.', 'MBA')."
    )
    field: Optional[str] = Field(
        default=None, description="Field of study (e.g. 'Computer Science')."
    )
    start_date: Optional[str] = Field(default=None, description="Start date YYYY-MM.")
    end_date: Optional[str] = Field(
        default=None, description="End or graduation date YYYY-MM."
    )
    gpa: Optional[float] = Field(
        default=None,
        description="GPA on a 4.0 or 10.0 scale if explicitly stated. Null otherwise.",
    )


class Certification(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., description="Certification name (e.g. 'AWS Solutions Architect').")
    issuer: Optional[str] = Field(default=None, description="Issuing body or organization.")
    date: Optional[str] = Field(default=None, description="Date issued in YYYY-MM format.")
    expires: Optional[str] = Field(
        default=None, description="Expiry date in YYYY-MM format if applicable."
    )


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., description="Project name as written in the resume.")
    description: Optional[str] = Field(
        default=None, description="One-sentence description of what the project does."
    )
    tech: list[str] = Field(
        default_factory=list,
        description="Technologies/tools used in the project.",
    )
    links: list[Link] = Field(
        default_factory=list,
        description="Repository, demo, or write-up links for the project.",
    )


class Language(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., description="Language name (e.g. 'English', 'Spanish').")
    proficiency: Optional[ProficiencyLevel] = Field(
        default=None,
        description="One of: basic, conversational, professional, fluent, native.",
    )


class Candidate(BaseModel):
    """The maximum possible candidate record. Dynamic profiles narrow this down."""

    model_config = ConfigDict(extra="ignore")

    full_name: str = Field(..., description="Candidate's full legal name.")
    headline: Optional[str] = Field(
        default=None,
        description="One-line professional headline near the top (e.g. 'Senior Backend Engineer').",
    )
    summary: Optional[str] = Field(
        default=None,
        description="The 'About' / 'Summary' / 'Profile' paragraph if present.",
    )
    contact: Contact = Field(
        default_factory=Contact, description="Contact details and external profile links."
    )
    skills: list[Skill] = Field(
        default_factory=list,
        description="Distinct skills mentioned anywhere in the resume.",
    )
    experience: list[Experience] = Field(
        default_factory=list,
        description="Work experience entries, most recent first.",
    )
    education: list[Education] = Field(
        default_factory=list,
        description="Education entries, most recent first.",
    )
    certifications: list[Certification] = Field(
        default_factory=list, description="Professional certifications and licenses."
    )
    projects: list[Project] = Field(
        default_factory=list, description="Personal or professional projects."
    )
    languages: list[Language] = Field(
        default_factory=list, description="Spoken/written human languages and proficiency."
    )
    total_years_experience: Optional[float] = Field(
        default=None,
        description=(
            "Total professional years of experience computed by summing non-overlapping "
            "experience spans, rounded to one decimal."
        ),
    )
    raw_text_excerpt: Optional[str] = Field(
        default=None,
        description="First ~500 characters of the parsed resume, for debugging only.",
    )


class ParseResponse(BaseModel):
    candidate: dict
    meta: dict
