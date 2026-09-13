import { useState } from "react";
import { Check, Copy, RotateCcw, Download, FileText, BarChart3 } from "lucide-react";

import type { VerificationResponse } from "../types";
import { CitationList } from "./CitationList";
import { ClaimList } from "./ClaimList";
import { ConfidenceGauge } from "./ConfidenceGauge";
import { DistributionChart } from "./DistributionChart";

interface ResultsViewProps {
  result: VerificationResponse;
  onVerifyAgain: () => void;
}

function summaryText(result: VerificationResponse): string {
  return (
    `HalluciCheck report ${result.verification_id}\n` +
    `Model: ${result.model} | Mode: ${result.demo_mode ? "Demo" : "Live"}\n` +
    `Overall confidence: ${result.overall_confidence}%\n` +
    `Claims checked: ${result.claims_checked} ` +
    `(${result.verified_count} verified, ${result.suspicious_count} suspicious, ${result.hallucinated_count} hallucinated)`
  );
}

export function ResultsView({ result, onVerifyAgain }: ResultsViewProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summaryText(result));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  }

  // 📥 Export JSON Report
  function handleDownloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `HalluciCheck_Report_${result.verification_id || "export"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // 📥 Export Summary Text Report
  function handleDownloadTextReport() {
    const reportContent = 
      `========================================\n` +
      `          HALLUCICHECK REPORT           \n` +
      `========================================\n\n` +
      summaryText(result) + `\n\n` +
      `--- CLAIMS BREAKDOWN ---\n` +
      result.claims.map((c, i) => `\n[${i+1}] ${c.text}\nStatus: ${c.status.toUpperCase()} (${Math.round(c.confidence)}%)\nReason: ${c.reasoning || ""}`).join("\n") +
      `\n\n========================================\n`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HalluciCheck_Report_${result.verification_id || "summary"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  // 📊 Calculate Confidence Tier Ranges for the Trend Breakdown
  const highConfCount = result.claims.filter(c => c.confidence >= 80).length;
  const medConfCount = result.claims.filter(c => c.confidence >= 50 && c.confidence < 80).length;
  const lowConfCount = result.claims.filter(c => c.confidence < 50).length;
  const totalClaims = result.claims.length || 1;

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Verification complete</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">
            {result.verification_id} · {result.demo_mode ? "Demo evidence" : "Live web evidence"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 rounded border border-hairline bg-white px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-ink-soft/40 hover:text-ink"
            title="Download JSON Report"
          >
            <Download size={14} />
            JSON
          </button>
          <button
            type="button"
            onClick={handleDownloadTextReport}
            className="flex items-center gap-1.5 rounded border border-hairline bg-white px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-ink-soft/40 hover:text-ink"
            title="Download Text Report"
          >
            <FileText size={14} />
            Export Report
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded border border-hairline bg-white px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-ink-soft/40 hover:text-ink"
          >
            {copied ? <Check size={14} className="text-verified" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onVerifyAgain}
            className="flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-sm text-paper transition-opacity hover:opacity-90"
          >
            <RotateCcw size={14} />
            Verify again
          </button>
        </div>
      </div>

      <section className="rounded border border-hairline bg-white p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
          <ConfidenceGauge value={result.overall_confidence} />
          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-1">
            <Stat label="Claims analyzed" value={result.claims_checked} />
            <Stat label="Verified" value={result.verified_count} tone="verified" />
            <Stat label="Suspicious" value={result.suspicious_count} tone="suspicious" />
            <Stat label="Hallucinated" value={result.hallucinated_count} tone="hallucinated" />
          </div>
        </div>
      </section>

      <section className="rounded border border-hairline bg-white p-6">
        <h2 className="mb-4 font-display text-lg text-ink">Claim distribution</h2>
        <DistributionChart
          distribution={result.distribution}
          verifiedCount={result.verified_count}
          suspiciousCount={result.suspicious_count}
          hallucinatedCount={result.hallucinated_count}
        />
      </section>

      {/* 📊 NEW FEATURE: Confidence Trend / Tier Breakdown Chart */}
      <section className="rounded border border-hairline bg-white p-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={18} className="text-ink-soft" />
          <h2 className="font-display text-lg text-ink">Confidence Trend Breakdown</h2>
        </div>
        <p className="mb-4 text-sm text-ink-soft">Distribution of claims grouped by certainty tiers.</p>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-medium text-ink mb-1">
              <span>High Certainty (80% - 100%)</span>
              <span>{highConfCount} claims ({Math.round((highConfCount / totalClaims) * 100)}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(highConfCount / totalClaims) * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-ink mb-1">
              <span>Moderate Certainty (50% - 79%)</span>
              <span>{medConfCount} claims ({Math.round((medConfCount / totalClaims) * 100)}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(medConfCount / totalClaims) * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-ink mb-1">
              <span>Low / Flagged (&lt; 50%)</span>
              <span>{lowConfCount} claims ({Math.round((lowConfCount / totalClaims) * 100)}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${(lowConfCount / totalClaims) * 100}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* 🖍️ Highlight Text Snippets on UI */}
      <section className="rounded border border-hairline bg-white p-6">
        <h2 className="mb-1 font-display text-lg text-ink">Highlighted Text Snippets</h2>
        <p className="mb-4 text-sm text-ink-soft">Original input text rendered with status-based semantic highlights.</p>
        <div className="rounded-lg border border-hairline bg-zinc-50 p-4 leading-relaxed text-sm text-zinc-800 space-x-1">
          {result.claims.map((cl, i) => {
            const bgHighlight =
              cl.status === "verified"
                ? "bg-emerald-100 text-emerald-900 border-b-2 border-emerald-500"
                : cl.status === "suspicious"
                ? "bg-amber-100 text-amber-900 border-b-2 border-amber-500"
                : "bg-rose-100 text-rose-900 border-b-2 border-rose-500";
            return (
              <span key={i} className={`inline-block px-1.5 py-0.5 my-0.5 rounded transition-colors ${bgHighlight}`} title={`Status: ${cl.status} (${Math.round(cl.confidence)}%)`}>
                {cl.text}
              </span>
            );
          })}
        </div>
      </section>

      <section className="rounded border border-hairline bg-white p-6">
        <h2 className="mb-1 font-display text-lg text-ink">Claims</h2>
        <p className="mb-4 text-sm text-ink-soft">Every claim extracted from the text, with its verdict.</p>
        <ClaimList claims={result.claims} />
      </section>

      <section className="rounded border border-hairline bg-white p-6">
        <h2 className="mb-1 font-display text-lg text-ink">Citations</h2>
        <p className="mb-4 text-sm text-ink-soft">References detected in the text, checked for existence.</p>
        <CitationList citations={result.citations} />
      </section>
    </div>
  );
}

const STAT_TONE_CLASSES = {
  verified: "text-verified",
  suspicious: "text-suspicious",
  hallucinated: "text-hallucinated",
} as const;

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: keyof typeof STAT_TONE_CLASSES;
}) {
  const toneClass = tone ? STAT_TONE_CLASSES[tone] : "text-ink";
  return (
    <div className="rounded border border-hairline px-3.5 py-2.5 text-center sm:min-w-[9rem] sm:text-left">
      <span className={`block font-mono text-xl font-medium ${toneClass}`}>{value}</span>
      <span className="text-xs text-ink-soft">{label}</span>
    </div>
  );
}