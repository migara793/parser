from app.services.scoring_service import ScoringService


def test_required_skills_are_normalized_and_hard_failures_reject():
    breakdown = ScoringService.evaluate(
        candidate_data={
            "full_name": "Candidate",
            "skills": [{"name": "Python"}],
            "total_years_experience": 1,
            "education": [],
        },
        job_payload={
            "rules": {
                "min_years_experience": 3,
                "required_skills": ["PYTHON "],
                "preferred_skills": {},
            }
        },
        semantic_score=1.0,
    )

    assert breakdown.skills_match == 1.0
    assert breakdown.hard_requirements_met is False
    assert any("minimum experience" in failure for failure in breakdown.hard_failures)


def test_required_skills_are_case_and_punctuation_insensitive():
    breakdown = ScoringService.evaluate(
        candidate_data={
            "skills": [{"name": "React.js"}],
            "total_years_experience": 5,
            "education": [],
        },
        job_payload={
            "rules": {
                "required_skills": ["react js"],
                "preferred_skills": {},
            }
        },
        semantic_score=0.8,
    )

    assert breakdown.hard_requirements_met is True
    assert breakdown.skills_match == 1.0
