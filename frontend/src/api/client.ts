import axios, { AxiosError } from "axios";
import type { ApiError, CatalogField, ExtractionProfile, ParseResponse } from "../types";

const baseURL = import.meta.env.VITE_API_BASE ?? "/api";

export const http = axios.create({ baseURL, timeout: 120_000 });

export async function fetchCatalog(): Promise<CatalogField[]> {
  const r = await http.get<CatalogField[]>("/fields");
  return r.data;
}

export async function fetchHealth(): Promise<{
  status: string;
  model: string;
  provider: string;
}> {
  const r = await http.get("/health");
  return r.data;
}

export async function parseResume(
  file: File,
  profile: ExtractionProfile,
): Promise<ParseResponse> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("profile", JSON.stringify(profile));
  try {
    const r = await http.post<ParseResponse>("/parse", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data;
  } catch (e) {
    const err = e as AxiosError<ApiError>;
    const msg =
      err.response?.data?.error?.message ??
      err.message ??
      "Unknown error while parsing resume.";
    throw new Error(msg);
  }
}

// Shortlist Agent API
export const shortlistHttp = axios.create({ baseURL: "/shortlist", timeout: 30_000 });

export interface HRRules {
  min_years_experience?: number;
  required_skills: string[];
  preferred_skills: Record<string, number>;
  min_degree?: string;
  location_preference?: string;
}

export interface JobDescription {
  job_id: string;
  title: string;
  description: string;
  company_context?: string;
  rules: HRRules;
}

export interface EvaluationResponse {
  job_id: string;
  candidate_name: string;
  score: number;
  breakdown: {
    semantic_similarity: number;
    experience_match: number;
    skills_match: number;
    education_match: number;
    total_score: number;
  };
  reasoning: string;
  status: string;
}

export interface ShortlistResult {
  candidate_id: string;
  name: string;
  score: number;
  metadata: any;
}

export interface ShortlistResponse {
  job_id: string;
  candidates: ShortlistResult[];
}

export async function fetchJobs(): Promise<JobDescription[]> {
  const r = await shortlistHttp.get("/jobs");
  return r.data;
}

export async function createJob(job: Partial<JobDescription>): Promise<{ job_id: string }> {
  const r = await shortlistHttp.post("/jobs", job);
  return r.data;
}

export async function evaluateCandidate(job_id: string, candidate_data: any, save_to_pool: boolean = false): Promise<EvaluationResponse> {
  const r = await shortlistHttp.post("/evaluate", { job_id, candidate_data, save_to_pool });
  return r.data;
}

export async function fetchShortlist(job_id: string): Promise<ShortlistResponse> {
  const r = await shortlistHttp.get(`/jobs/${job_id}/shortlist`);
  return r.data;
}

export async function saveCandidateToPool(candidate_data: any): Promise<{ candidate_id: string }> {
  const r = await shortlistHttp.post("/candidates", { data: candidate_data });
  return r.data;
}
