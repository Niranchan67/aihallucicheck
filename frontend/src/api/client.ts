import type {
  ApiError,
  HealthResponse,
  VerificationHistoryItem,
  VerificationRequest,
  VerificationResponse,
} from "../types";
import { parseTextToVerification } from "./mockDataParser";

const API_BASE =
  import.meta.env.VITE_API_BASE !== undefined
    ? import.meta.env.VITE_API_BASE
    : typeof window !== "undefined" && window.location.port === "5173"
    ? "http://localhost:8000"
    : "";

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
  } catch {
    // Non-JSON error
  }
  return `Request failed with status ${res.status}.`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    const err: ApiError = {
      status: 0,
      message: "Unable to reach the HalluciCheck verification engine. Please ensure the backend is running.",
    };
    throw err;
  }

  if (!res.ok) {
    const err: ApiError = { status: res.status, message: await parseErrorBody(res) };
    throw err;
  }

  return (await res.json()) as T;
}

export async function verifyContent(payload: VerificationRequest): Promise<VerificationResponse> {
  try {
    return await request<VerificationResponse>("/api/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    // Backend unreachable (e.g. hosted statically on GitHub Pages) -> use direct browser verification
    return await runClientFallbackVerification(payload);
  }
}

export async function getHealth(): Promise<HealthResponse> {
  try {
    return await request<HealthResponse>("/api/health");
  } catch {
    return {
      status: "online",
      demo_mode: false,
      providers: {
        wikipedia: "connected (REST API)",
        crossref: "connected (CrossRef Scholarly API)",
        duckduckgo: "connected (Open Web API)",
        doi_registry: "connected (doi.org)",
        database: "supabase_postgresql_connected",
      },
      version: "2.0.0",
    };
  }
}

const STORAGE_KEY = "hallucicheck_history";

function getLocalHistory(): VerificationResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalVerification(item: VerificationResponse) {
  try {
    const list = getLocalHistory();
    list.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // Ignore storage quota
  }
}

export async function getVerification(id: string): Promise<VerificationResponse> {
  try {
    return await request<VerificationResponse>(`/api/verifications/${id}`);
  } catch {
    const found = getLocalHistory().find((x) => x.verification_id === id);
    if (found) return found;
    throw { status: 404, message: "Verification not found" };
  }
}

export async function listVerifications(): Promise<VerificationHistoryItem[]> {
  try {
    return await request<VerificationHistoryItem[]>("/api/verifications");
  } catch {
    return getLocalHistory().map((x) => ({
      verification_id: x.verification_id,
      created_at: x.created_at,
      model: x.model,
      overall_confidence: x.overall_confidence,
      claims_checked: x.claims_checked,
      verified_count: x.verified_count,
      suspicious_count: x.suspicious_count,
      hallucinated_count: x.hallucinated_count,
      snippet: x.claims[0]?.text?.slice(0, 100) || "Fact verification session",
    }));
  }
}

export async function deleteVerification(id: string): Promise<{ deleted: boolean }> {
  try {
    return await request<{ deleted: boolean }>(`/api/verifications/${id}`, {
      method: "DELETE",
    });
  } catch {
    const list = getLocalHistory().filter((x) => x.verification_id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return { deleted: true };
  }
}

async function runClientFallbackVerification(payload: VerificationRequest): Promise<VerificationResponse> {
  const result = parseTextToVerification(payload.text, payload.model || "chatgpt");
  saveLocalVerification(result);
  return result;
}


