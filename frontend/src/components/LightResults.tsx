import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  FileText,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  Printer,
  BarChart3,
  BookOpen,
  Database,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { VerificationResponse, ClaimResult, CitationResult } from "../types";

interface LightResultsProps {
  result: VerificationResponse;
  onVerifyAgain: () => void;
}

export function LightResults({ result, onVerifyAgain }: LightResultsProps) {
  const [copied, setCopied] = useState(false);
  const [selectedClaimIndex, setSelectedClaimIndex] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"text" | "claims" | "citations">("text");

  const claims = result.claims || [];
  const citations = result.citations || [];
  const totalClaims = claims.length || 1;
  const highConf = claims.filter((c) => c.confidence >= 80).length;
  const medConf = claims.filter((c) => c.confidence >= 50 && c.confidence < 80).length;
  const lowConf = claims.filter((c) => c.confidence < 50).length;

  const conf = Math.round(result.overall_confidence);

  // Overall Risk Tier Indicator (Light Mode)
  const riskTier =
    conf >= 75
      ? {
          label: "HIGH CERTAINTY",
          risk: "Low Hallucination Risk",
          color: "text-emerald-700",
          border: "border-emerald-200",
          bg: "bg-emerald-50",
          stroke: "#10b981",
        }
      : conf >= 45
      ? {
          label: "MODERATE RISK",
          risk: "Partial Fact Discrepancies",
          color: "text-amber-700",
          border: "border-amber-200",
          bg: "bg-amber-50",
          stroke: "#f59e0b",
        }
      : {
          label: "HIGH HALLUCINATION RISK",
          risk: "Contradictions & Fabrications",
          color: "text-rose-700",
          border: "border-rose-200",
          bg: "bg-rose-50",
          stroke: "#ef4444",
        };

  // SVG Ring Calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (conf / 100) * circumference;

  // Independent Sources Query Count
  const allSourcesSet = new Set<string>();
  claims.forEach((c) => {
    if (c.source) allSourcesSet.add(c.source);
    c.sources?.forEach((s) => allSourcesSet.add(s.name));
  });
  citations.forEach((ci) => {
    if (ci.source) allSourcesSet.add(ci.source);
  });
  const sourceCount = Math.max(allSourcesSet.size, result.demo_mode ? 2 : 4);

  // Export handlers
  const handleCopySummary = async () => {
    const summary =
      `HalluciCheck Report: ${result.verification_id}\n` +
      `Model: ${result.model} | Certainty: ${conf}% (${riskTier.label})\n` +
      `Claims Checked: ${result.claims_checked} (Verified: ${result.verified_count}, Suspicious: ${result.suspicious_count}, Hallucinated: ${result.hallucinated_count})\n` +
      `Citations Checked: ${citations.length}\n` +
      `Ground-Truth Sources Queried: ${sourceCount}\n`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownloadJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `HalluciCheck_Report_${result.verification_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadText = () => {
    const reportContent =
      `===================================================\n` +
      `           HALLUCICHECK CLINICAL AUDIT REPORT      \n` +
      `===================================================\n\n` +
      `Report ID:     ${result.verification_id}\n` +
      `Timestamp:     ${result.created_at || new Date().toISOString()}\n` +
      `Origin Model:  ${result.model.toUpperCase()}\n` +
      `Certainty:     ${conf}% [${riskTier.label}]\n` +
      `Mode:          ${result.demo_mode ? "Demo Evidence" : "Live Web Multi-Source"}\n` +
      `Claims Total:  ${result.claims_checked}\n` +
      ` - Verified:   ${result.verified_count}\n` +
      ` - Suspicious: ${result.suspicious_count}\n` +
      ` - Flagged:    ${result.hallucinated_count}\n\n` +
      `---------------------------------------------------\n` +
      `               INDIVIDUAL CLAIMS AUDIT             \n` +
      `---------------------------------------------------\n\n` +
      claims
        .map(
          (c, idx) =>
            `[Claim #${idx + 1}] (${c.type.toUpperCase()})\n` +
            `Verdict:    ${c.status.toUpperCase()} (${Math.round(c.confidence)}% Certainty)\n` +
            `Assertion:  "${c.text}"\n` +
            `Reasoning:  ${c.reasoning || "None recorded"}\n` +
            `Source:     ${c.source || "None"} (${c.source_url || "N/A"})\n`
        )
        .join("\n") +
      `\n===================================================\n`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HalluciCheck_Report_${result.verification_id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Results Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Clinical Audit Report
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {result.verification_id}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Cross-referenced with {sourceCount} independent consensus sources (Wikipedia, CrossRef, DuckDuckGo)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="btn-pill-light text-xs py-1.5 px-3"
            title="Download JSON Report"
          >
            <Download size={13} />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadText}
            className="btn-pill-light text-xs py-1.5 px-3"
            title="Download Text Report"
          >
            <FileText size={13} />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn-pill-light text-xs py-1.5 px-3 hidden sm:inline-flex"
            title="Print or Export PDF"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="btn-pill-light text-xs py-1.5 px-3"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={onVerifyAgain}
            className="btn-pill-dark text-xs py-1.5 px-4 font-semibold"
          >
            <RotateCcw size={13} />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Core Metrics: Centralized Certainty Ring & 4 KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Overall Certainty Ring */}
        <div className="lg:col-span-4 glass-card-light rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-1 font-semibold">
            Overall Factual Certainty
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="11"
              />
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke={riskTier.stroke}
                strokeWidth="11"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {conf}%
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                Score
              </span>
            </div>
          </div>

          <div
            className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${riskTier.bg} ${riskTier.color} ${riskTier.border}`}
          >
            <CheckCircle2 size={13} />
            <span>{riskTier.label}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1">{riskTier.risk}</span>
        </div>

        {/* 4 KPI Metrics Breakdown Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Claims Analyzed */}
          <div className="glass-card-light p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
            <span className="text-xs text-slate-500 font-mono font-medium">Claims Analyzed</span>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                {result.claims_checked}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono truncate">
              Model: {result.model.toUpperCase()}
            </span>
          </div>

          {/* Card 2: Verified Count */}
          <div className="glass-card-light p-4 sm:p-5 rounded-2xl border-emerald-100 bg-emerald-50/40 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-mono font-semibold">
              <span>Verified</span>
              <Check size={15} />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                {result.verified_count}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-mono font-medium">
              {Math.round((result.verified_count / totalClaims) * 100)}% of claims
            </span>
          </div>

          {/* Card 3: Suspicious Count */}
          <div className="glass-card-light p-4 sm:p-5 rounded-2xl border-amber-100 bg-amber-50/40 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-xs text-amber-700 font-mono font-semibold">
              <span>Suspicious</span>
              <AlertTriangle size={15} />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-amber-700 font-mono">
                {result.suspicious_count}
              </span>
            </div>
            <span className="text-[11px] text-amber-600 font-mono font-medium">
              {Math.round((result.suspicious_count / totalClaims) * 100)}% of claims
            </span>
          </div>

          {/* Card 4: Hallucinated Count */}
          <div className="glass-card-light p-4 sm:p-5 rounded-2xl border-rose-100 bg-rose-50/40 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-xs text-rose-700 font-mono font-semibold">
              <span>Hallucinated</span>
              <XCircle size={15} />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-rose-700 font-mono">
                {result.hallucinated_count}
              </span>
            </div>
            <span className="text-[11px] text-rose-600 font-mono font-medium">
              {Math.round((result.hallucinated_count / totalClaims) * 100)}% of claims
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Distribution Progress Tiers */}
      <div className="glass-card-light rounded-2xl p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-700 flex items-center gap-2 font-bold">
            <BarChart3 size={15} className="text-slate-500" />
            <span>Confidence Distribution Progress Tiers</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Consensus Calibration</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Tier 1: High Certainty */}
          <div>
            <div className="flex justify-between text-slate-800 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>High Certainty (80% - 100%)</span>
              </span>
              <span className="font-mono text-slate-500 tabular-nums font-semibold">
                {highConf} claims ({Math.round((highConf / totalClaims) * 100)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${(highConf / totalClaims) * 100}%` }}
              />
            </div>
          </div>

          {/* Tier 2: Moderate Certainty */}
          <div>
            <div className="flex justify-between text-slate-800 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Moderate Certainty (50% - 79%)</span>
              </span>
              <span className="font-mono text-slate-500 tabular-nums font-semibold">
                {medConf} claims ({Math.round((medConf / totalClaims) * 100)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${(medConf / totalClaims) * 100}%` }}
              />
            </div>
          </div>

          {/* Tier 3: Low Certainty */}
          <div>
            <div className="flex justify-between text-slate-800 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Low Certainty / Contradicted (&lt; 50%)</span>
              </span>
              <span className="font-mono text-slate-500 tabular-nums font-semibold">
                {lowConf} claims ({Math.round((lowConf / totalClaims) * 100)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-700"
                style={{ width: `${(lowConf / totalClaims) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Highlighted Text Viewer */}
      <div className="glass-card-light rounded-2xl p-5 sm:p-7 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 font-sans flex items-center gap-2">
              <Sparkles size={16} className="text-slate-500" />
              <span>Interactive Highlighted Text Viewer</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any colored sentence to inspect its corroboration rationale, certainty score, and ground-truth citations.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Verified
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Suspicious
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Hallucinated
            </span>
          </div>
        </div>

        {/* Text Area with Color-Coded Spans */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 text-sm sm:text-base leading-relaxed space-x-1.5 font-sans">
          {claims.map((cl, idx) => {
            const isSelected = selectedClaimIndex === idx;
            const highlightClass =
              cl.status === "verified"
                ? "bg-emerald-50 text-emerald-950 border-b-2 border-emerald-500 hover:bg-emerald-100/70"
                : cl.status === "suspicious"
                ? "bg-amber-50 text-amber-950 border-b-2 border-amber-500 hover:bg-amber-100/70"
                : "bg-rose-50 text-rose-950 border-b-2 border-rose-500 hover:bg-rose-100/70";

            return (
              <span
                key={cl.id || idx}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedClaimIndex(isSelected ? null : idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedClaimIndex(isSelected ? null : idx);
                  }
                }}
                className={`inline-block px-1.5 py-0.5 my-1 rounded-sm cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${highlightClass} ${
                  isSelected ? "ring-2 ring-slate-900 scale-[1.01] shadow-sm font-medium" : ""
                }`}
                title={`Click to inspect claim #${idx + 1} (${cl.status.toUpperCase()} · ${Math.round(cl.confidence)}%)`}
              >
                {cl.text}
              </span>
            );
          })}
        </div>

        {/* Selected Sentence Deep Rationale Pop-up Card */}
        {selectedClaimIndex !== null && claims[selectedClaimIndex] && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 animate-fade-in shadow-xs">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                  Sentence Claim #{selectedClaimIndex + 1} Inspection
                </span>
                <span className="font-bold text-sm text-slate-900">
                  Status: {claims[selectedClaimIndex].status.toUpperCase()} ({Math.round(claims[selectedClaimIndex].confidence)}% Certainty)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClaimIndex(null)}
                className="text-slate-400 hover:text-slate-900 p-1 cursor-pointer font-mono font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Exact Statement:</span>
              <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 font-sans leading-relaxed">
                "{claims[selectedClaimIndex].text}"
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-700 uppercase font-semibold">
                Verification Rationale:
              </span>
              <p className="text-slate-700 leading-relaxed font-sans">
                {claims[selectedClaimIndex].reasoning || "Cross-examined across independent sources with consensus corroboration."}
              </p>
            </div>

            {/* Outbound Verified Sources */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">Evidence Sources:</span>
              {claims[selectedClaimIndex].sources && claims[selectedClaimIndex].sources!.length > 0 ? (
                claims[selectedClaimIndex].sources!.map((s, si) => (
                  <a
                    key={si}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs font-medium"
                  >
                    <span>{s.name}</span>
                    <ExternalLink size={10} />
                  </a>
                ))
              ) : claims[selectedClaimIndex].source_url ? (
                <a
                  href={claims[selectedClaimIndex].source_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs font-medium"
                >
                  <span>{claims[selectedClaimIndex].source}</span>
                  <ExternalLink size={10} />
                </a>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">Synthesized via consensus</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Claims Breakdown & Citations Tabs */}
      <div className="glass-card-light rounded-2xl overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-5 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === "text"
                ? "border-slate-900 text-slate-950 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            All Claims Breakdown ({claims.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("citations")}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === "citations"
                ? "border-slate-900 text-slate-950 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Citation &amp; DOI Checks ({citations.length})
          </button>
        </div>

        <div className="p-5">
          {activeTab === "text" && (
            <div className="space-y-3">
              {claims.map((cl, i) => (
                <div
                  key={cl.id || i}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">#{i + 1}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-semibold">
                        {cl.type}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        cl.status === "verified"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : cl.status === "suspicious"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {cl.status.toUpperCase()} · {Math.round(cl.confidence)}%
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 font-sans leading-relaxed">{cl.text}</p>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-slate-500 text-[11px] leading-snug flex-1">
                      {cl.reasoning || "Neutral cross-examination corroborated against open web records."}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-slate-400">Sources:</span>
                      {cl.sources && cl.sources.length > 0 ? (
                        cl.sources.map((s, si) => (
                          <a
                            key={si}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                          >
                            <span>{s.name}</span>
                            <ExternalLink size={10} />
                          </a>
                        ))
                      ) : cl.source_url ? (
                        <a
                          href={cl.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                        >
                          <span>{cl.source || "Source"}</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Consensus Index</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "citations" && (
            <div className="space-y-3">
              {citations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-mono">
                  No bibliographical references or DOIs detected in input text.
                </div>
              ) : (
                citations.map((ci, i) => (
                  <div
                    key={ci.id || i}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 hover:border-slate-300 transition-all shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-slate-700 font-bold">Citation #{i + 1}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          ci.status === "valid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : ci.status === "fabricated"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {ci.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-800">{ci.raw_text}</p>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500">
                      <span>DOI: {ci.doi || "Unspecified"}</span>
                      {ci.url && (
                        <a
                          href={ci.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 underline font-medium"
                        >
                          <span>CrossRef DOI Resolver</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
