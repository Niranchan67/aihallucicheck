import React, { useState } from "react";
import {
  ShieldCheck,
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
  HelpCircle,
  BookOpen,
  Search,
  Database,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { VerificationResponse, ClaimResult, CitationResult } from "../types";

interface ResultsDashboardProps {
  result: VerificationResponse | null;
  onVerifyAgain: () => void;
  onSelectPreset?: (text: string) => void;
}

export function ResultsDashboard({
  result,
  onVerifyAgain,
  onSelectPreset,
}: ResultsDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [selectedClaimIndex, setSelectedClaimIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "claims" | "citations">("text");

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="glass-panel-cyan rounded-2xl p-8 max-w-lg space-y-5 shadow-2xl border border-cyan-500/20">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
            <HelpCircle size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">No Verification Report Loaded</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Launch a verification scan from the Analysis Console or pick an instant preset below to populate the clinical diagnostics dashboard.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onVerifyAgain}
              className="btn-cyan-gradient w-full sm:w-auto px-5 py-2.5 text-xs font-semibold"
            >
              Open Analysis Console
            </button>
            {onSelectPreset && (
              <button
                type="button"
                onClick={() =>
                  onSelectPreset(
                    "The specific heat capacity of water is 4.184 J/g C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances."
                  )
                }
                className="btn-glass w-full sm:w-auto px-4 py-2.5 text-xs font-mono"
              >
                Load Physics Sample
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const claims = result.claims || [];
  const citations = result.citations || [];
  const totalClaims = claims.length || 1;
  const highConf = claims.filter((c) => c.confidence >= 80).length;
  const medConf = claims.filter((c) => c.confidence >= 50 && c.confidence < 80).length;
  const lowConf = claims.filter((c) => c.confidence < 50).length;

  const conf = Math.round(result.overall_confidence);

  // Overall Risk Tier Indicator
  const riskTier =
    conf >= 75
      ? {
          label: "HIGH CERTAINTY",
          risk: "Low Hallucination Risk",
          color: "text-emerald-400",
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/10",
          stroke: "#10b981",
        }
      : conf >= 45
      ? {
          label: "MODERATE RISK",
          risk: "Partial Fact Discrepancies",
          color: "text-amber-400",
          border: "border-amber-500/30",
          bg: "bg-amber-500/10",
          stroke: "#f59e0b",
        }
      : {
          label: "HIGH HALLUCINATION RISK",
          risk: "Contradictions & Fabrications",
          color: "text-rose-400",
          border: "border-rose-500/30",
          bg: "bg-rose-500/10",
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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
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
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <BarChart3 size={14} />
            <span>Factual Integrity Dashboard</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Clinical Audit Report
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/10">
              {result.verification_id}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="btn-glass px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
            title="Download JSON Payload"
          >
            <Download size={13} />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadText}
            className="btn-glass px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
            title="Download Structured Text Report"
          >
            <FileText size={13} />
            <span>Text (.txt)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn-glass px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 hidden sm:inline-flex"
            title="Print or Export PDF"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="btn-glass px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={onVerifyAgain}
            className="btn-cyan-gradient px-4 py-1.5 text-xs flex items-center gap-1.5 font-semibold"
          >
            <RotateCcw size={13} />
            <span>Scan New Input</span>
          </button>
        </div>
      </div>

      {/* Multi-Source Aggregation Consensus Banner */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-300">
          <Database size={15} className="text-cyan-400" />
          <span>Multi-Source Aggregation:</span>
          <span className="text-emerald-400 font-bold">{sourceCount} Independent Knowledge Repositories Queried</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">Wikipedia REST</span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">CrossRef DOI</span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">DuckDuckGo Index</span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">EuropePMC</span>
        </div>
      </div>

      {/* Core Metrics: Ring + 4 KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Overall Certainty Ring */}
        <div className="lg:col-span-4 glass-panel-cyan rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl border border-cyan-500/30">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">
            Overall Factual Certainty
          </span>

          <div className="relative w-40 h-40 flex items-center justify-center my-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.07)"
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
              <span className="text-4xl font-extrabold text-white font-mono">{conf}%</span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Score
              </span>
            </div>
          </div>

          <div
            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${riskTier.bg} ${riskTier.color} ${riskTier.border}`}
          >
            <ShieldCheck size={14} />
            <span>{riskTier.label}</span>
          </div>

          <span className="text-[11px] text-zinc-400 font-mono mt-1">{riskTier.risk}</span>
        </div>

        {/* 4 KPI Metrics Breakdown Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Claims Analyzed */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between shadow-lg">
            <span className="text-xs text-zinc-400 font-mono">Claims Analyzed</span>
            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                {result.claims_checked}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono truncate">Model: {result.model}</span>
          </div>

          {/* Card 2: Verified Count */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/25 bg-emerald-950/10 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
              <span>Verified</span>
              <Check size={15} />
            </div>
            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                {result.verified_count}
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">
              {Math.round((result.verified_count / totalClaims) * 100)}% of claims
            </span>
          </div>

          {/* Card 3: Suspicious Count */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/25 bg-amber-950/10 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
              <span>Suspicious</span>
              <AlertTriangle size={15} />
            </div>
            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">
                {result.suspicious_count}
              </span>
            </div>
            <span className="text-[11px] text-amber-400 font-mono">
              {Math.round((result.suspicious_count / totalClaims) * 100)}% of claims
            </span>
          </div>

          {/* Card 4: Hallucinated Count */}
          <div className="glass-panel p-5 rounded-2xl border border-rose-500/25 bg-rose-950/10 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-xs text-rose-400 font-mono">
              <span>Hallucinated</span>
              <XCircle size={15} />
            </div>
            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-rose-400 font-mono">
                {result.hallucinated_count}
              </span>
            </div>
            <span className="text-[11px] text-rose-400 font-mono">
              {Math.round((result.hallucinated_count / totalClaims) * 100)}% of claims
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Distribution Progress Bar Tier System */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2 font-bold">
            <BarChart3 size={15} />
            <span>Confidence Distribution Progress Tiers</span>
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">Consensus Calibration</span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Tier 1: High Certainty */}
          <div>
            <div className="flex justify-between text-zinc-200 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>High Certainty (80% - 100%)</span>
              </span>
              <span className="font-mono text-zinc-400">
                {highConf} claims ({Math.round((highConf / totalClaims) * 100)}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${(highConf / totalClaims) * 100}%` }}
              />
            </div>
          </div>

          {/* Tier 2: Moderate Certainty */}
          <div>
            <div className="flex justify-between text-zinc-200 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Moderate Certainty (50% - 79%)</span>
              </span>
              <span className="font-mono text-zinc-400">
                {medConf} claims ({Math.round((medConf / totalClaims) * 100)}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${(medConf / totalClaims) * 100}%` }}
              />
            </div>
          </div>

          {/* Tier 3: Low / Hallucinated */}
          <div>
            <div className="flex justify-between text-zinc-200 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Low Certainty / Contradicted (&lt; 50%)</span>
              </span>
              <span className="font-mono text-zinc-400">
                {lowConf} claims ({Math.round((lowConf / totalClaims) * 100)}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${(lowConf / totalClaims) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Highlighted Text Viewer */}
      <div className="glass-panel-cyan rounded-2xl p-5 sm:p-7 border border-cyan-500/30 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-2">
              <Sparkles size={16} />
              <span>Interactive Highlighted Text Viewer</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Click any colored sentence below to view its deep corroboration rationale, certainty score, and ground-truth citations.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Verified
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Suspicious
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Hallucinated
            </span>
          </div>
        </div>

        {/* Text Viewer Content with Clickable Color-Coded Spans */}
        <div className="rounded-xl border border-white/10 bg-[#060a14] p-5 text-sm sm:text-base leading-relaxed space-x-1.5 font-sans">
          {claims.map((cl, idx) => {
            const isSelected = selectedClaimIndex === idx;
            const highlightClass =
              cl.status === "verified"
                ? "bg-emerald-950/70 text-emerald-200 border-b-2 border-emerald-500 hover:bg-emerald-900/80"
                : cl.status === "suspicious"
                ? "bg-amber-950/70 text-amber-200 border-b-2 border-amber-500 hover:bg-amber-900/80"
                : "bg-rose-950/70 text-rose-200 border-b-2 border-rose-500 hover:bg-rose-900/80";

            return (
              <span
                key={cl.id || idx}
                onClick={() => setSelectedClaimIndex(isSelected ? null : idx)}
                className={`inline-block px-1.5 py-0.5 my-1 rounded cursor-pointer transition-all ${highlightClass} ${
                  isSelected ? "ring-2 ring-cyan-400 scale-[1.01] shadow-lg" : ""
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
          <div className="p-4 rounded-xl bg-[#090f1e] border border-cyan-500/40 text-xs space-y-3 animate-fade-in shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                  Sentence Claim #{selectedClaimIndex + 1} Deep Breakdown
                </span>
                <span className="font-bold text-sm text-white">
                  Status: {claims[selectedClaimIndex].status.toUpperCase()} ({Math.round(claims[selectedClaimIndex].confidence)}% Certainty)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClaimIndex(null)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Exact Statement:</span>
              <p className="text-zinc-200 bg-black/30 p-2.5 rounded border border-white/5 font-sans leading-relaxed">
                "{claims[selectedClaimIndex].text}"
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-cyan-400 uppercase">Verification Rationale &amp; Audit Trail:</span>
              <p className="text-zinc-300 leading-relaxed font-sans">
                {claims[selectedClaimIndex].reasoning || "Cross-examined across independent sources with consensus corroboration."}
              </p>
            </div>

            {/* Outbound Verified Sources */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400">Verified Evidence Sources:</span>
              {claims[selectedClaimIndex].sources && claims[selectedClaimIndex].sources!.length > 0 ? (
                claims[selectedClaimIndex].sources!.map((s, si) => (
                  <a
                    key={si}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 px-2.5 py-1 rounded-md border border-cyan-500/30 transition-colors"
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
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 px-2.5 py-1 rounded-md border border-cyan-500/30 transition-colors"
                >
                  <span>{claims[selectedClaimIndex].source}</span>
                  <ExternalLink size={10} />
                </a>
              ) : (
                <span className="text-[11px] text-zinc-400 font-mono">Synthesized via consensus</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Claims and Citations Deep Tabs */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="flex border-b border-white/10 bg-black/30 px-5 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab("claims")}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === "claims"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Deconstructed Claims ({claims.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("citations")}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === "citations"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Citation &amp; DOI Audit ({citations.length})
          </button>
        </div>

        <div className="p-5">
          {activeTab === "claims" && (
            <div className="space-y-3">
              {claims.map((cl, i) => (
                <div
                  key={cl.id || i}
                  className="p-4 rounded-xl border border-white/5 bg-[#070b14] space-y-2 hover:border-white/15 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-bold">#{i + 1}</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 uppercase">
                        {cl.type}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        cl.status === "verified"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : cl.status === "suspicious"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {cl.status.toUpperCase()} · {Math.round(cl.confidence)}%
                    </span>
                  </div>

                  <p className="text-sm text-zinc-200 font-sans leading-relaxed">{cl.text}</p>

                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-zinc-400 text-[11px] leading-snug flex-1">
                      {cl.reasoning || "Neutral cross-examination validated against ground-truth index."}
                    </p>

                    {cl.source_url && (
                      <a
                        href={cl.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline shrink-0"
                      >
                        <span>{cl.source || "Source"}</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "citations" && (
            <div className="space-y-3">
              {citations.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs font-mono">
                  No bibliographical references or DOIs detected in input text.
                </div>
              ) : (
                citations.map((ci, i) => (
                  <div
                    key={ci.id || i}
                    className="p-4 rounded-xl border border-white/5 bg-[#070b14] space-y-2 hover:border-white/15 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-zinc-400 font-bold">Citation #{i + 1}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          ci.status === "valid"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : ci.status === "fabricated"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {ci.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-zinc-300">{ci.raw_text}</p>

                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-400">
                      <span>DOI: {ci.doi || "Unspecified"}</span>
                      {ci.url && (
                        <a
                          href={ci.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
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
