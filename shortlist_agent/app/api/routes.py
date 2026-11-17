from fastapi import FastAPI, HTTPException
from app.schemas import HRRules, JobDescription, EvaluationRequest, EvaluationResponse, Candidate, ShortlistResponse, ShortlistResult
from app.config import get_settings
from app.services.qdrant_service import QdrantService
from app.services.scoring_service import ScoringService
import uuid
import numpy as np

app = FastAPI(title="Shortlist Agent", version="0.1.0")
settings = get_settings()
qdrant = QdrantService()

def get_candidate_text(data: dict) -> str:
    text = f"{data.get('headline', '')} {data.get('summary', '')}"
    contact = data.get("contact", {}) or {}
    text += f" {contact.get('location', '')}"
    for exp in data.get('experience', []):
        text += f" {exp.get('title', '')} {exp.get('company', '')} {' '.join(exp.get('bullets', []))}"
    for skill in data.get('skills', []):
        text += f" {skill.get('name', '') if isinstance(skill, dict) else skill}"
    for project in data.get("projects", []):
        text += f" {project.get('name', '')} {project.get('description', '')} {' '.join(project.get('tech', []))}"
    return text


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    left_vector = np.asarray(left, dtype=float)
    right_vector = np.asarray(right, dtype=float)
    denominator = np.linalg.norm(left_vector) * np.linalg.norm(right_vector)
    return float(np.dot(left_vector, right_vector) / denominator) if denominator else 0.0

@app.get("/health")
async def health():
    return {"status": "ok", "qdrant": settings.qdrant_url}

@app.get("/jobs")
async def list_jobs():
    results = qdrant.list_jobs()
    return [{"job_id": str(res.id), **res.payload} for res in results]

@app.post("/jobs")
async def create_job(job: JobDescription):
    job_id = str(uuid.uuid4())
    qdrant.upsert_job(
        job_id=job_id,
        text=f"{job.title} {job.description} {job.company_context or ''}",
        metadata=job.model_dump()
    )
    return {"job_id": job_id, "message": "Job created and vectorized"}

@app.post("/candidates")
async def add_candidate(candidate: Candidate):
    candidate_id = candidate.id or str(uuid.uuid4())
    candidate_text = get_candidate_text(candidate.data)
    qdrant.upsert_candidate(
        candidate_id=candidate_id,
        text=candidate_text,
        metadata=candidate.data
    )
    return {"candidate_id": candidate_id, "message": "Candidate added to talent pool"}

@app.post("/evaluate")
async def evaluate_candidate(request: EvaluationRequest):
    job_data = qdrant.get_job(request.job_id)
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
        
    candidate_text = get_candidate_text(request.candidate_data)
    
    job_vector = job_data.vector
    candidate_vector = qdrant.model.encode(candidate_text)
    
    # Calculate cosine similarity
    semantic_score = _cosine_similarity(job_vector, candidate_vector)
    
    breakdown = ScoringService.evaluate(
        candidate_data=request.candidate_data,
        job_payload=job_data.payload,
        semantic_score=semantic_score
    )
    
    rules = HRRules(**job_data.payload.get("rules", {}))
    status = ScoringService.status_for(breakdown, rules)

    reasoning = f"Candidate evaluated with a total score of {breakdown.total_score:.2f}."
    if breakdown.hard_failures:
        reasoning += " Hard requirements failed: " + "; ".join(breakdown.hard_failures) + "."
    
    if request.save_to_pool:
        candidate_id = str(uuid.uuid4())
        qdrant.upsert_candidate(
            candidate_id=candidate_id,
            text=candidate_text,
            metadata=request.candidate_data
        )

    return EvaluationResponse(
        job_id=request.job_id,
        candidate_name=request.candidate_data.get("full_name", "Unknown"),
        score=breakdown.total_score,
        breakdown=breakdown,
        reasoning=reasoning,
        status=status
    )

@app.get("/jobs/{job_id}/shortlist")
async def get_shortlist(job_id: str, limit: int = 10):
    job_data = qdrant.get_job(job_id)
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    results = []
    for candidate in qdrant.list_candidates():
        if not candidate.vector:
            continue
        breakdown = ScoringService.evaluate(
            candidate_data=candidate.payload,
            job_payload=job_data.payload,
            semantic_score=_cosine_similarity(job_data.vector, candidate.vector),
        )
        if not breakdown.hard_requirements_met:
            continue
        results.append((candidate, breakdown))

    results.sort(key=lambda item: item[1].total_score, reverse=True)
    
    shortlist = []
    for res, breakdown in results[:limit]:
        shortlist.append(ShortlistResult(
            candidate_id=str(res.id),
            name=res.payload.get("full_name", "Unknown"),
            score=breakdown.total_score,
            metadata=res.payload,
            status=ScoringService.status_for(
                breakdown,
                HRRules(**job_data.payload.get("rules", {})),
            ),
            breakdown=breakdown,
        ))
    
    return ShortlistResponse(job_id=job_id, candidates=shortlist)
