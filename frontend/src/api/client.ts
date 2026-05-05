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
