# Shortlist Agent Architecture & Plan

This document outlines the architecture for the Shortlist Agent, a new service designed to evaluate parsed candidate profiles against job requirements stored in a Qdrant vector database.

## 1. System Architecture

The Shortlist Agent will be a standalone microservice that interacts with the existing Parser and a new Qdrant instance.

### Components
- **Parser Backend**: (Existing) Extracts structured `Candidate` data from resumes.
- **Shortlist Agent (New)**: Python FastAPI service handling matching logic, rule evaluation, and vector search.
- **Qdrant (New)**: Vector database to store Job Descriptions (JDs) and candidate embeddings.
- **Embedding Engine**: Converts text (JDs and Candidate summaries) into numerical vectors (e.g., using `sentence-transformers` or OpenAI).

### Data Flow
1. **Job Creation**: HR uploads a Job Description + Rules -> Shortlist Agent vectorizes JD -> Stores in Qdrant.
2. **Shortlisting**: Parser sends `Candidate` object to Shortlist Agent -> Shortlist Agent vectorizes candidate data -> Queries Qdrant for matching JDs -> Applies HR rules -> Returns match score & breakdown.

---

## 2. HR Configurable Rules

HR can define and update the following rules for each job to fine-tune the shortlisting process:

### A. Hard Filters (Pass/Fail)
- **Minimum Years of Experience**: Total years required (e.g., `min_years: 5`).
- **Mandatory Skills**: Skills that must be present (e.g., `required_skills: ["Python", "Docker"]`).
- **Education Level**: Minimum degree required (e.g., `min_degree: "B.Sc."`).
- **Location**: Specific cities or "Remote" requirement.

### B. Soft Weights (Scoring)
- **Skill Importance**: Assign weights (1-10) to specific skills.
- **Keyword Matching**: Boost score if specific keywords (e.g., "Fintech", "Scaleup") appear in experience.
- **Recency**: Give higher weight to skills used in the most recent 2 years.

### C. Knowledge Base Comparison
- **Semantic Similarity**: Compare the candidate's professional summary and experience bullets against the Job Description text using Qdrant vector search.
- **Culture Fit**: Compare candidate's "soft skills" against company values stored in the knowledge base.

---

## 3. Knowledge Base (Vector Store)

The Knowledge Base is powered by Qdrant and consists of:
- **Job Description Collection**: Each point represents a JD with its metadata (rules, department, salary range).
- **Company Knowledge Collection**: (Optional) Stores company-wide standards, value descriptions, and interview guidelines to provide context for AI-driven shortlisting.

---

## 4. Implementation Plan

### Phase 1: Infrastructure
- Add `qdrant` service to `docker-compose.yml`.
- Set up `shortlist_agent` skeleton (FastAPI + Pydantic models).

### Phase 2: Knowledge Base Management
- Implement `POST /jobs`: Create a JD, vectorize it, and store in Qdrant.
- Implement `GET /jobs`: Retrieve job list and rules.
- Implement `PATCH /jobs/{id}`: Update JD or rules.

### Phase 3: Shortlisting Logic
- Implement `POST /evaluate`:
    1. Receive `Candidate` and `job_id`.
    2. Vectorize Candidate (Summary + Experience + Skills).
    3. Calculate cosine similarity with JD vector in Qdrant.
    4. Execute rule-based scoring (Years of Exp, Mandatory Skills).
    5. Generate a JSON report with `total_score` and `reasoning`.

### Phase 4: Frontend UI
- **Job Manager**: Page for HR to create/edit jobs and rules.
- **Shortlist View**: Display candidates ranked by match score for a specific job.

---

## 5. Technology Stack
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Vector DB**: Qdrant
- **ML**: `sentence-transformers` (all-MiniLM-L6-v2) for local embeddings.
- **Database**: SQLite/PostgreSQL (for job metadata if Qdrant payload is insufficient).
