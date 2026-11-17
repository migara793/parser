from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator

class HRRules(BaseModel):
    min_years_experience: Optional[float] = Field(None, description="Minimum total years of experience required.")
    required_skills: List[str] = Field(default_factory=list, description="List of mandatory skills.")
    preferred_skills: Dict[str, int] = Field(default_factory=dict, description="Skills with weights (1-10) for scoring.")
    min_degree: Optional[str] = Field(None, description="Minimum education level (e.g., 'B.Sc.').")
    location_preference: Optional[str] = Field(None, description="Preferred location or 'Remote'.")
    shortlist_threshold: float = Field(0.7, ge=0, le=1, description="Minimum score for Shortlisted status.")
    hold_threshold: float = Field(0.5, ge=0, le=1, description="Minimum score for Hold status.")

    @model_validator(mode="after")
    def validate_thresholds(self):
        if self.hold_threshold > self.shortlist_threshold:
            raise ValueError("hold_threshold must be less than or equal to shortlist_threshold")
        return self

class JobDescription(BaseModel):
    title: str
    description: str
    company_context: Optional[str] = Field(None, description="Additional company or team context.")
    rules: HRRules

class Candidate(BaseModel):
    id: Optional[str] = None
    data: Dict[str, Any]

class EvaluationRequest(BaseModel):
    job_id: str
    candidate_data: Dict = Field(..., description="The structured candidate JSON from the parser.")
    save_to_pool: bool = False

class ScoreBreakdown(BaseModel):
    semantic_similarity: float
    experience_match: float
    skills_match: float
    education_match: float
    total_score: float
    hard_requirements_met: bool = True
    hard_failures: List[str] = Field(default_factory=list)

class EvaluationResponse(BaseModel):
    job_id: str
    candidate_name: str
    score: float
    breakdown: ScoreBreakdown
    reasoning: str
    status: str = Field(..., description="e.g., 'Shortlisted', 'Hold', 'Rejected'")

class ShortlistResult(BaseModel):
    candidate_id: str
    name: str
    score: float
    metadata: Dict[str, Any]
    status: str = "Shortlisted"
    breakdown: ScoreBreakdown | None = None

class ShortlistResponse(BaseModel):
    job_id: str
    candidates: List[ShortlistResult]
