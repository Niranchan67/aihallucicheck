import type {
  VerificationResponse,
  ClaimResult,
  CitationResult,
  ClaimType,
  ClaimStatus,
} from "../types";

const LAST_RESULT_KEY = "hallucicheck_last_result";

/**
 * Retrieve active result from localStorage safely without throwing.
 */
export function getStoredVerificationResult(): VerificationResponse | null {
  try {
    const raw = localStorage.getItem(LAST_RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.verification_id && Array.isArray(parsed.claims)) {
      return parsed as VerificationResponse;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generic fallback parser for offline client diagnostics.
 * Strictly adheres to verification principles:
 * - Never invents verified status or fake evidence.
 * - Unverified offline statements are marked as 'suspicious' or 'unverified'
 *   pending live backend verification across authoritative registries.
 */
export function parseTextToVerification(
  inputText: string,
  model: string = "chatgpt"
): VerificationResponse {
  const text = (inputText || "").trim();
  if (!text) {
    throw new Error("Cannot verify empty statement.");
  }

  const verificationId = `hc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  // Deconstruct input into statements
  const rawSentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9\"'])|\n+/)
    .map((s) => s.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((s) => s.length > 3);

  const sentencesToProcess = rawSentences.length > 0 ? rawSentences : [text];
  const claims: ClaimResult[] = [];

  for (let i = 0; i < sentencesToProcess.length; i++) {
    const statement = sentencesToProcess[i];

    // Determine statement type
    const hasNumber = /\b\d+(\.\d+)?%?\b/.test(statement);
    const hasYear = /\b(1[6-9]\d{2}|20\d{2})\b/.test(statement);
    const isOpinion = /^(i think|i believe|in my opinion|it seems|personally|arguably|i feel)\b/i.test(statement);

    let type: ClaimType = "factual";
    if (hasNumber) type = "statistical";
    else if (hasYear) type = "historical";
    else if (isOpinion) type = "opinion";

    // Generic classification when operating without live backend:
    // Absence of verified multi-source consensus means claims must remain SUSPICIOUS.
    let status: ClaimStatus = "suspicious";
    let confidence = 45.0;
    let reasoning = "Awaiting live multi-source cross-examination: Live connection to backend verification pipeline required for authoritative entailment.";

    if (type === "opinion") {
      confidence = 50.0;
      reasoning = "Subjective statement expressing personal perspective or qualitative sentiment rather than verifiable factual assertion.";
    }

    claims.push({
      id: `claim-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
      text: statement,
      type,
      status,
      confidence,
      evidence: "Verification pending live multi-source ground truth retrieval.",
      source: "Offline Diagnostic Buffer",
      source_url: null,
      sources: [],
      reasoning,
    });
  }

  const total = claims.length;
  const verifiedCount = claims.filter((c) => c.status === "verified").length;
  const suspiciousCount = claims.filter((c) => c.status === "suspicious" || c.status === "unverified").length;
  const hallucinatedCount = claims.filter((c) => c.status === "hallucinated").length;

  const verifiedPct = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;
  const suspiciousPct = total > 0 ? Math.round((suspiciousCount / total) * 100) : 0;
  const hallucinatedPct = total > 0 ? Math.round((hallucinatedCount / total) * 100) : 0;

  const weightedSum = claims.reduce((acc, c) => {
    if (c.status === "verified") return acc + 1.0;
    if (c.status === "suspicious") return acc + 0.45;
    if (c.status === "unverified") return acc + 0.35;
    return acc;
  }, 0);

  const overallConfidence = total > 0 ? Math.round((weightedSum / total) * 1000) / 10 : 0;

  return {
    verification_id: verificationId,
    created_at: nowIso,
    model,
    overall_confidence: overallConfidence,
    claims_checked: total,
    verified_count: verifiedCount,
    suspicious_count: suspiciousCount,
    hallucinated_count: hallucinatedCount,
    distribution: {
      verified_pct: verifiedPct,
      suspicious_pct: suspiciousPct,
      hallucinated_pct: hallucinatedPct,
    },
    claims,
    citations: [],
    demo_mode: false,
    stages: [
      "Claim Extraction",
      "Atomic Fact Extraction",
      "Entity & Relationship Extraction",
      "Evidence Retrieval",
      "URL Validation",
      "Source Validation",
      "Evidence Entailment",
      "Contradiction Detection",
      "Confidence Calculation",
    ],
  };
}
