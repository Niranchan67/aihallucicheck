import React, { useState } from "react";
import {
  Download,
  FileText,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  BarChart3,
  ExternalLink,
  Printer,
} from "lucide-react";
import type { VerificationResponse } from "../types";

interface SlideDashboardProps {
  result: VerificationResponse | null;
  onGoToEvidence: () => void;
  onVerifyAgain: () => void;
}

export function SlideDashboard({
  result,
  onGoToEvidence,
  onVerifyAgain,
}: SlideDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [selectedSnippetIndex, setSelectedSnippetIndex] = useState<number | null>(null);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] text-center p-6">
        <div className="rounded-xl border border-zinc-800 bg-[#0c0d12] p-8 max-w-md space-y-4 shadow-xl">
          <HelpCircle size={40} className="mx-auto text-zinc-500" />
          <h2 className="text-xl font-bold text-white">No Verification Active</h2>
          <p className="text-xs text-zinc-400">
            Please run a verification from the workstation or load a report from history to view results.
          </p>
          <button
            type="button"
            onClick={onVerifyAgain}
            className="bg-white text-black font-semibold rounded-md px-5 py-2.5 text-xs hover:bg-zinc-200 transition-all shadow-md cursor-pointer"
          >
            Go to Workstation (Slide 04)
          </button>
        </div>
      </div>
    );
  }

  const claims = result.claims || [];
  const totalClaims = claims.length || 1;
  const highConf = claims.filter((c) => c.confidence >= 80).length;
  const medConf = claims.filter((c) => c.confidence >= 50 && c.confidence < 80).length;
  const lowConf = claims.filter((c) => c.confidence < 50).length;

  const conf = Math.round(result.overall_confidence);
  const qualitative =
    conf >= 75
      ? { label: "High Factual Grounding", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" }
      : conf >= 45
      ? { label: "Moderate Risk / Ambiguous", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" }
      : { label: "High Hallucination Risk", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" };

  const handleCopySummary = async () => {
    const summary =
      `HalluciCheck Report: ${result.verification_id}\n` +
      `AI Model: ${result.model}\n` +
      `Overall Confidence: ${result.overall_confidence}%\n` +
      `Claims Checked: ${result.claims_checked} ` +
      `(${result.verified_count} verified, ${result.suspicious_count} suspicious, ${result.hallucinated_count} hallucinated)\n` +
      `Citations Checked: ${result.citations.length}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `HalluciCheck_${result.verification_id}.json`;
    a.click();
  };

  const handleDownloadText = () => {
    const reportText =
      `============================================================\n` +
      `       AI HALLUCINATION VERIFICATION SYSTEM - REPORT        \n` +
      `============================================================\n\n` +
      `Verification ID: ${result.verification_id}\n` +
      `Created At:      ${result.created_at}\n` +
      `Source Model:    ${result.model}\n` +
      `Overall Score:   ${result.overall_confidence}%\n` +
      `Claims Checked:  ${result.claims_checked}\n` +
      `Verified:        ${result.verified_count}\n` +
      `Suspicious:      ${result.suspicious_count}\n` +
      `Hallucinated:    ${result.hallucinated_count}\n\n` +
      `------------------------------------------------------------\n` +
      `                     EXTRACTED CLAIMS                       \n` +
      `------------------------------------------------------------\n` +
      result.claims
        .map(
          (c, i) =>
            `\n[Claim #${i + 1}] (${c.type.toUpperCase()})\n` +
            `Statement:   ${c.text}\n` +
            `Verdict:     ${c.status.toUpperCase()} (${Math.round(c.confidence)}%)\n` +
            `Reasoning:   ${c.reasoning || "N/A"}\n` +
            `Evidence:    ${c.evidence || "N/A"}\n` +
            `Source:      ${c.source || "N/A"} (${c.source_url || "N/A"})\n`
        )
        .join("\n") +
      `\n\n------------------------------------------------------------\n` +
      `                 CITATIONS & DOI AUDIT                      \n` +
      `------------------------------------------------------------\n` +
      (result.citations.length === 0
        ? "No academic citations or DOIs detected.\n"
        : result.citations
            .map(
              (ct, i) =>
                `\n[Citation #${i + 1}]\n` +
                `Reference:   ${ct.raw_text}\n` +
                `Status:      ${ct.status.toUpperCase()} (Exists: ${ct.exists})\n` +
                `Source:      ${ct.source || "N/A"}\n` +
                `Notes:       ${ct.note || "N/A"}\n`
            )
            .join("\n"));

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HalluciCheck_${result.verification_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const circumference = 2 * Math.PI * 52;
  const strokeOffset = circumference - (conf / 100) * circumference;

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-140px)] py-6 max-w-5xl mx-auto px-4">
      {/* Top Action Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-1 font-semibold">
            Slide 06 of 09 · Verification Results Dashboard
          </span>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Clinical Verification Report
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
              {result.verification_id}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
          >
            <Download size={13} /> JSON
          </button>
          <button
            type="button"
            onClick={handleDownloadText}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
          >
            <FileText size={13} /> Text (.txt)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
          >
            <Printer size={13} /> Print/PDF
          </button>
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onVerifyAgain}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={13} /> New Scan
          </button>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Confidence Gauge Card */}
        <div className="lg:col-span-4 rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-6 flex flex-col items-center justify-center text-center shadow-xl">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">
            Overall Confidence Score
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={conf >= 75 ? "#10b981" : conf >= 45 ? "#f59e0b" : "#ef4444"}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-white font-mono">{conf}%</span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Certainty</span>
            </div>
          </div>

          <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${qualitative.bg} ${qualitative.color}`}>
            <ShieldCheck size={14} />
            <span>{qualitative.label}</span>
          </div>
        </div>

        {/* 4 KPI Stat Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-4 flex flex-col justify-between shadow-md">
            <span className="text-xs text-zinc-400 font-mono">Claims Checked</span>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-white font-mono">{result.claims_checked}</span>
            </div>
            <span className="text-[11px] text-zinc-500">Model: {result.model}</span>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
              <span>Verified</span>
              <Check size={16} />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">{result.verified_count}</span>
            </div>
            <span className="text-[11px] text-emerald-500/80">
              {Math.round((result.verified_count / totalClaims) * 100)}% of claims
            </span>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
              <span>Suspicious</span>
              <AlertTriangle size={16} />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-amber-400 font-mono">{result.suspicious_count}</span>
            </div>
            <span className="text-[11px] text-amber-500/80">
              {Math.round((result.suspicious_count / totalClaims) * 100)}% of claims
            </span>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between text-xs text-rose-400 font-mono">
              <span>Hallucinated</span>
              <XCircle size={16} />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-rose-400 font-mono">{result.hallucinated_count}</span>
            </div>
            <span className="text-[11px] text-rose-500/80">
              {Math.round((result.hallucinated_count / totalClaims) * 100)}% of claims
            </span>
          </div>
        </div>
      </div>

      {/* Certainty Tier Breakdown Bars */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-5 mb-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-2 font-semibold">
            <BarChart3 size={15} /> Confidence Distribution &amp; Certainty Tiers
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">Multi-source consensus</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <div className="flex justify-between text-zinc-300 font-medium mb-1">
              <span>High Certainty (80% - 100%)</span>
              <span className="font-mono">{highConf} claims ({Math.round((highConf / totalClaims) * 100)}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${(highConf / totalClaims) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-zinc-300 font-medium mb-1">
              <span>Moderate Certainty (50% - 79%)</span>
              <span className="font-mono">{medConf} claims ({Math.round((medConf / totalClaims) * 100)}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${(medConf / totalClaims) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-zinc-300 font-medium mb-1">
              <span>Low / Hallucinated (&lt; 50%)</span>
              <span className="font-mono">{lowConf} claims ({Math.round((lowConf / totalClaims) * 100)}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-500"
                style={{ width: `${(lowConf / totalClaims) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Text Highlighter */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-5 mb-6 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
            Interactive Highlighted Text
          </h3>
          <span className="text-[11px] text-zinc-400">Click any sentence to inspect verdict</span>
        </div>
        <p className="text-xs text-zinc-400 mb-3">
          Statements color-coded by factual accuracy: green (verified), amber (suspicious), red (hallucination).
        </p>

        <div className="rounded-lg border border-zinc-800 bg-[#050507] p-4 text-sm leading-relaxed space-x-1.5">
          {claims.map((cl, i) => {
            const isSelected = selectedSnippetIndex === i;
            const highlightClass =
              cl.status === "verified"
                ? "bg-emerald-950/60 text-emerald-200 border-b-2 border-emerald-500 hover:bg-emerald-900/60"
                : cl.status === "suspicious"
                ? "bg-amber-950/60 text-amber-200 border-b-2 border-amber-500 hover:bg-amber-900/60"
                : "bg-rose-950/60 text-rose-200 border-b-2 border-rose-500 hover:bg-rose-900/60";

            return (
              <span
                key={cl.id}
                onClick={() => setSelectedSnippetIndex(isSelected ? null : i)}
                className={`inline-block px-1.5 py-0.5 rounded cursor-pointer transition-all ${highlightClass} ${
                  isSelected ? "ring-2 ring-indigo-400 scale-[1.01]" : ""
                }`}
                title={`Status: ${cl.status.toUpperCase()} (${Math.round(cl.confidence)}%)`}
              >
                {cl.text}
              </span>
            );
          })}
        </div>

        {/* Selected snippet detail tooltip */}
        {selectedSnippetIndex !== null && claims[selectedSnippetIndex] && (
          <div className="mt-3 p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex items-start justify-between gap-3 animate-in fade-in">
            <div>
              <span className="font-mono text-indigo-400 font-bold block mb-1">
                Claim #{selectedSnippetIndex + 1} Verdict: {claims[selectedSnippetIndex].status.toUpperCase()} (
                {Math.round(claims[selectedSnippetIndex].confidence)}% Confidence)
              </span>
              <p className="text-zinc-300">{claims[selectedSnippetIndex].reasoning}</p>

              {/* Ground truth links */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400">Sources:</span>
                {claims[selectedSnippetIndex].sources && claims[selectedSnippetIndex].sources!.length > 0 ? (
                  claims[selectedSnippetIndex].sources!.map((s, si) => (
                    <a
                      key={si}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/80 transition-colors"
                    >
                      <span>{s.name}</span>
                      <ExternalLink size={10} />
                    </a>
                  ))
                ) : claims[selectedSnippetIndex].source_url ? (
                  <a
                    href={claims[selectedSnippetIndex].source_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/80 transition-colors"
                  >
                    <span>{claims[selectedSnippetIndex].source}</span>
                    <ExternalLink size={10} />
                  </a>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSnippetIndex(null)}
              className="text-zinc-500 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Button to Slide 7 (Evidence & Citations) */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onVerifyAgain}
          className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw size={14} /> Scan Another Input
        </button>

        <button
          type="button"
          onClick={onGoToEvidence}
          className="bg-white text-black font-semibold rounded-md px-6 py-2.5 text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-md cursor-pointer"
        >
          <span>View Detailed Evidence &amp; Citations (Slide 07)</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
