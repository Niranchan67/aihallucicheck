import { useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

import type { AiModel, ApiError, VerificationResponse } from "../types";
import { verifyContent } from "../api/client";
import { InputEditor } from "./InputEditor";
import { ProgressPipeline } from "./ProgressPipeline";
import { VerificationOptions } from "./VerificationOptions";

const MAX_CHARS = 5000;

interface VerifyViewProps {
  onVerified: (result: VerificationResponse) => void;
}

export function VerifyView({ onVerified }: VerifyViewProps) {
  const [text, setText] = useState("");
  const [model, setModel] = useState<AiModel>("chatgpt");
  const [verifyClaims, setVerifyClaims] = useState(true);
  const [verifyCitations, setVerifyCitations] = useState(true);
  const [verifyStatistics, setVerifyStatistics] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_CHARS && status !== "running";

  async function handleAnalyze() {
    if (!trimmed) {
      setError("Please enter AI-generated content to analyze.");
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setError("Your content exceeds the maximum allowed length.");
      return;
    }

    setStatus("running");
    setError(null);

    try {
      const result = await verifyContent({
        text: trimmed,
        model,
        verify_claims: verifyClaims,
        verify_citations: verifyCitations,
        verify_statistics: verifyStatistics,
      });
      setStatus("idle");
      onVerified(result);
    } catch (err) {
      const apiError = err as ApiError;
      setStatus("error");
      setError(
        apiError.status === 0
          ? "Unable to connect to HalluciCheck. Check that the backend is running and try again."
          : apiError.message
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Verify what AI says</h1>
        <p className="mt-2 text-ink-soft">
          Paste AI-generated text below. HalluciCheck extracts each factual claim, checks it
          independently against evidence, and validates any citations before you trust it.
        </p>
      </div>

      <InputEditor value={text} onChange={setText} maxChars={MAX_CHARS} disabled={status === "running"} />

      <VerificationOptions
        options={{ model, verifyClaims, verifyCitations, verifyStatistics }}
        onChange={(o) => {
          setModel(o.model);
          setVerifyClaims(o.verifyClaims);
          setVerifyCitations(o.verifyCitations);
          setVerifyStatistics(o.verifyStatistics);
        }}
        disabled={status === "running"}
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded border border-hallucinated/30 bg-hallucinated-soft px-4 py-3 text-sm text-hallucinated">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {status === "running" && <ProgressPipeline status="running" />}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded bg-ink px-5 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "running" ? "Analyzing…" : "Analyze content"}
        {status !== "running" && <ArrowRight size={16} />}
      </button>
    </div>
  );
}
