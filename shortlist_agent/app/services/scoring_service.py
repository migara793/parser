import re
from typing import Any, Dict, List
import numpy as np
from app.schemas import HRRules, ScoreBreakdown

class ScoringService:
    @staticmethod
    def _normalize(value: Any) -> str:
        return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())

    @staticmethod
    def _skill_names(candidate_skills: List[Dict]) -> set[str]:
        names: set[str] = set()
        for skill in candidate_skills or []:
            if isinstance(skill, dict):
                name = skill.get("name", "")
            else:
                name = skill
            normalized = ScoringService._normalize(name)
            if normalized:
                names.add(normalized)
        return names

    @staticmethod
    def status_for(breakdown: ScoreBreakdown, rules: HRRules) -> str:
        if not breakdown.hard_requirements_met:
            return "Rejected"
        if breakdown.total_score >= rules.shortlist_threshold:
            return "Shortlisted"
        if breakdown.total_score >= rules.hold_threshold:
            return "Hold"
        return "Rejected"

    @staticmethod
    def calculate_experience_score(candidate_years: float, min_years: float | None) -> float:
        if min_years is None or min_years == 0:
            return 1.0
        if candidate_years >= min_years:
            return 1.0
        return candidate_years / min_years

    @staticmethod
    def calculate_skills_score(candidate_skills: List[Dict], required: List[str], preferred: Dict[str, int]) -> float:
        candidate_skill_names = ScoringService._skill_names(candidate_skills)
        
        # Hard check for required skills
        if required:
            missing_required = [
                skill for skill in required
                if ScoringService._normalize(skill) not in candidate_skill_names
            ]
            if missing_required:
                return 0.0
        
        if not preferred:
            return 1.0
            
        score = 0.0
        max_possible = sum(preferred.values())
        for skill, weight in preferred.items():
            if ScoringService._normalize(skill) in candidate_skill_names:
                score += weight
        
        return score / max_possible if max_possible > 0 else 1.0

    @staticmethod
    def evaluate(candidate_data: Dict, job_payload: Dict, semantic_score: float) -> ScoreBreakdown:
        rules_dict = job_payload.get("rules", {})
        rules = HRRules(**rules_dict)

        candidate_years = candidate_data.get("total_years_experience", 0) or 0
        candidate_skills = candidate_data.get("skills", []) or []
        candidate_skill_names = ScoringService._skill_names(candidate_skills)
        hard_failures: list[str] = []

        if rules.min_years_experience and candidate_years < rules.min_years_experience:
            hard_failures.append(
                f"minimum experience is {rules.min_years_experience:g} years"
            )

        missing_required = [
            skill for skill in rules.required_skills
            if ScoringService._normalize(skill) not in candidate_skill_names
        ]
        if missing_required:
            hard_failures.append("missing required skills: " + ", ".join(missing_required))
        
        exp_score = ScoringService.calculate_experience_score(
            candidate_years,
            rules.min_years_experience
        )
        
        skills_score = ScoringService.calculate_skills_score(
            candidate_skills,
            rules.required_skills,
            rules.preferred_skills
        )
        
        edu_score = 1.0
        if rules.min_degree:
            degrees = [
                e.get("degree", "").lower()
                for e in (candidate_data.get("education", []) or [])
                if isinstance(e, dict)
            ]
            if not any(rules.min_degree.lower() in d for d in degrees):
                edu_score = 0.5
                hard_failures.append(f"minimum degree is {rules.min_degree}")

        if rules.location_preference:
            contact = candidate_data.get("contact", {}) or {}
            locations = []
            if isinstance(contact, dict) and contact.get("location"):
                locations.append(contact["location"])
            locations.extend(
                exp.get("location", "")
                for exp in (candidate_data.get("experience", []) or [])
                if isinstance(exp, dict) and exp.get("location")
            )
            preferred_location = ScoringService._normalize(rules.location_preference)
            location_match = any(
                preferred_location in ScoringService._normalize(location)
                or ScoringService._normalize(location) in preferred_location
                for location in locations
            )
            if not location_match:
                hard_failures.append(f"preferred location is {rules.location_preference}")
                
        total_score = (semantic_score * 0.4) + (exp_score * 0.2) + (skills_score * 0.3) + (edu_score * 0.1)
        
        return ScoreBreakdown(
            semantic_similarity=semantic_score,
            experience_match=exp_score,
            skills_match=skills_score,
            education_match=edu_score,
            total_score=total_score,
            hard_requirements_met=not hard_failures,
            hard_failures=hard_failures,
        )
