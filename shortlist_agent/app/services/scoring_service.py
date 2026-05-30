from typing import Dict, List
import numpy as np
from app.schemas import HRRules, ScoreBreakdown

class ScoringService:
    @staticmethod
    def calculate_experience_score(candidate_years: float, min_years: float | None) -> float:
        if min_years is None or min_years == 0:
            return 1.0
        if candidate_years >= min_years:
            return 1.0
        return candidate_years / min_years

    @staticmethod
    def calculate_skills_score(candidate_skills: List[Dict], required: List[str], preferred: Dict[str, int]) -> float:
        candidate_skill_names = {s["name"].lower() for s in candidate_skills}
        
        # Hard check for required skills
        if required:
            missing_required = [s for s in required if s.lower() not in candidate_skill_names]
            if missing_required:
                return 0.0
        
        if not preferred:
            return 1.0
            
        score = 0.0
        max_possible = sum(preferred.values())
        for skill, weight in preferred.items():
            if skill.lower() in candidate_skill_names:
                score += weight
        
        return score / max_possible if max_possible > 0 else 1.0

    @staticmethod
    def evaluate(candidate_data: Dict, job_payload: Dict, semantic_score: float) -> ScoreBreakdown:
        rules_dict = job_payload.get("rules", {})
        rules = HRRules(**rules_dict)
        
        exp_score = ScoringService.calculate_experience_score(
            candidate_data.get("total_years_experience", 0) or 0,
            rules.min_years_experience
        )
        
        skills_score = ScoringService.calculate_skills_score(
            candidate_data.get("skills", []),
            rules.required_skills,
            rules.preferred_skills
        )
        
        edu_score = 1.0
        if rules.min_degree:
            degrees = [e.get("degree", "").lower() for e in candidate_data.get("education", [])]
            if not any(rules.min_degree.lower() in d for d in degrees):
                edu_score = 0.5
                
        total_score = (semantic_score * 0.4) + (exp_score * 0.2) + (skills_score * 0.3) + (edu_score * 0.1)
        
        return ScoreBreakdown(
            semantic_similarity=semantic_score,
            experience_match=exp_score,
            skills_match=skills_score,
            education_match=edu_score,
            total_score=total_score
        )
