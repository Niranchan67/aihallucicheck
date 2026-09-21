export type ClaimType = "factual" | "statistical" | "historical" | "opinion";

export type ClaimStatus = "verified" | "suspicious" | "hallucinated" | "unverified";

export type CitationStatus = "valid" | "fabricated" | "unverified";

export type AiModel = "chatgpt" | "claude" | "gemini" | "llama" | "other";

export type WorkspaceView = "hub" | "console" | "results" | "history";
export type AppTab = "home" | "workspace" | "dashboard" | "history" | "evidence";


export interface VerificationRequest {
  text: string;
  model?: string;
  verify_claims: boolean;
  verify_citations: boolean;
  verify_statistics: boolean;
}

export interface SourceCitation {
  name: string;
  url: string;
  title?: string;
}

export interface PropositionProof {
  statement: string;
  prop_type: "primary" | "reason" | "date" | "location" | "attribution" | string;
  status: "supported" | "contradicted" | "partial" | "unverified" | string;
  evidence_excerpt?: string | null;
  source_name?: string | null;
  source_url?: string | null;
}

export interface AuthorityCheck {
  domain: string;
  source_name: string;
  authority_tier: number;
  authority_label: string;
  dataset: string;
  status: string;
}

export interface EvidenceProof {
  dataset: string;
  source_title: string;
  source_url: string;
  quote: string;
  authority_tier: number;
  authority_label: string;
  publication_year?: string | null;
}

export interface ClaimResult {
  id: string;
  text: string;
  type: ClaimType;
  status: ClaimStatus;
  confidence: number;
  evidence: string | null;
  source: string | null;
  source_url: string | null;
  sources?: SourceCitation[];
  reasoning: string | null;
  propositions_evaluated?: PropositionProof[];
  authority_checks?: AuthorityCheck[];
  evidence_proofs?: EvidenceProof[];
  contradiction_details?: string | null;
  start_index?: number;
  end_index?: number;
}

export interface CitationResult {
  id: string;
  raw_text: string;
  source: string | null;
  url: string | null;
  doi: string | null;
  exists: boolean;
  status: CitationStatus;
  note: string | null;
}

export interface Distribution {
  verified_pct: number;
  suspicious_pct: number;
  hallucinated_pct: number;
}

export interface VerificationResponse {
  verification_id: string;
  created_at: string;
  model: string;
  overall_confidence: number;
  claims_checked: number;
  verified_count: number;
  suspicious_count: number;
  hallucinated_count: number;
  distribution: Distribution;
  claims: ClaimResult[];
  citations: CitationResult[];
  demo_mode: boolean;
  stages: string[];
}

export interface VerificationHistoryItem {
  verification_id: string;
  created_at: string | null;
  model: string;
  overall_confidence: number;
  claims_checked: number;
  verified_count: number;
  suspicious_count: number;
  hallucinated_count: number;
  snippet: string;
}

export interface HealthResponse {
  status: string;
  demo_mode: boolean;
  providers: Record<string, string | boolean>;
  version: string;
}

export interface ApiError {
  status: number;
  message: string;
}
