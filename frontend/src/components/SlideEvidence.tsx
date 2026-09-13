import React, { useState } from "react";
import {
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  BookmarkCheck,
  Search,
  ArrowRight,
  ArrowLeft,
  FileCheck,
} from "lucide-react";
import type { ClaimResult, VerificationResponse } from "../types";

interface SlideEvidenceProps {
  result: VerificationResponse | null;
  onBackToDashboard: () => void;
  onNextToHistory: () => void;
}

export function SlideEvidence({
  result,
  onBackToDashboard,
  onNextToHistory,
}: SlideEvidenceProps) {
  const [filter, setFilter] = useState<"all" | "verified" | "suspicious" | "hallucinated">("all");
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] text-center p-6">
        <div className="rounded-xl border border-zinc-800 bg-[#0c0d12] p-8 max-w-md space-y-4 shadow-xl">
          <HelpCircle size={40} className="mx-auto text-zinc-500" />
          <h2 className="text-xl font-bold text-white">No Verification Active</h2>
          <p className="text-xs text-zinc-400">
            Please execute a verification from the workstation first.
          </p>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="bg-white text-black font-semibold rounded-md px-5 py-2.5 text-xs hover:bg-zinc-200 transition-all shadow-md cursor-pointer"
          >
            Go to Results
          </button>
        </div>
      </div>
    );
  }

  const claims = result.claims || [];
  const citations = result.citations || [];

  const filteredClaims = claims.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-140px)] py-6 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-1 font-semibold">
            Slide 07 of 09 · Evidence Traceability &amp; Citations
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Deep Evidence Audit &amp; Ground Truth Trace
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filter === "all" ? "bg-zinc-800 text-white border border-zinc-700 font-semibold" : "text-zinc-400 hover:text-white"
            }`}
          >
            All ({claims.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("verified")}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filter === "verified" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Verified ({result.verified_count})
          </button>
          <button
            type="button"
            onClick={() => setFilter("suspicious")}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filter === "suspicious" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Suspicious ({result.suspicious_count})
          </button>
          <button
            type="button"
            onClick={() => setFilter("hallucinated")}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filter === "hallucinated" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Hallucinated ({result.hallucinated_count})
          </button>
        </div>
      </div>

      {/* Claim Cards List */}
      <div className="space-y-3 mb-8">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
          <Search size={15} className="text-indigo-400" /> Extracted Claim Breakdowns
        </h2>

        {filteredClaims.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-6 text-center text-xs text-zinc-400">
            No claims found matching current filter.
          </div>
        ) : (
          filteredClaims.map((claim, idx) => {
            const isExpanded = expandedClaimId === claim.id;
            const statusColor =
              claim.status === "verified"
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                : claim.status === "suspicious"
                ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                : "text-rose-400 border-rose-500/30 bg-rose-500/10";

            return (
              <div
                key={claim.id}
                className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-4 sm:p-5 hover:border-zinc-700 transition-all shadow-md"
              >
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedClaimId(isExpanded ? null : claim.id)}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-400">
                        Claim #{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/5">
                        {claim.type}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                        {claim.status} · {Math.round(claim.confidence)}%
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-medium text-white leading-snug">
                      {claim.text}
                    </p>

                    {/* Quick source pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-zinc-500">Sources:</span>
                      {claim.sources && claim.sources.length > 0 ? (
                        claim.sources.map((s, si) => (
                          <span key={si} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {s.name}
                          </span>
                        ))
                      ) : claim.source ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {claim.source}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-zinc-400 hover:text-white transition-transform duration-200 mt-1"
                  >
                    <ChevronDown size={18} className={isExpanded ? "rotate-180" : ""} />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-xs animate-in fade-in">
                    {claim.reasoning && (
                      <div className="rounded-xl bg-[#090d16] p-3 border border-white/5">
                        <span className="font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                          Verification Reasoning:
                        </span>
                        <p className="text-zinc-300 leading-relaxed">{claim.reasoning}</p>
                      </div>
                    )}

                    {claim.evidence && (
                      <div className="rounded-xl bg-[#090d16] p-3 border border-white/5">
                        <span className="font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                          Retrieved Source Evidence:
                        </span>
                        <p className="text-zinc-300 italic leading-relaxed">
                          "{claim.evidence}"
                        </p>
                      </div>
                    )}

                    {/* Multi-Source Validation Links */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                          Corroborated Ground Truth Sources ({(claim.sources && claim.sources.length) || (claim.source ? 1 : 0)}):
                        </span>
                        {claim.source_url && (
                          <a
                            href={claim.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                          >
                            <span>Open Primary Citation</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {claim.sources && claim.sources.length > 0 ? (
                          claim.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-zinc-900/80 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-zinc-300 hover:text-cyan-300 transition-all text-xs"
                              title={src.title || src.name}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                              <span className="font-medium">{src.name}</span>
                              <ExternalLink size={10} className="text-zinc-500" />
                            </a>
                          ))
                        ) : claim.source ? (
                          <a
                            href={claim.source_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-zinc-900/80 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-zinc-300 hover:text-cyan-300 transition-all text-xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            <span className="font-medium">{claim.source}</span>
                            <ExternalLink size={10} className="text-zinc-500" />
                          </a>
                        ) : (
                          <span className="text-zinc-500 text-xs">No indexed link found</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Scholarly Citation Validation Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-5 mb-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-2 font-semibold">
            <BookmarkCheck size={16} /> Scholarly Citation &amp; DOI Audit (Stage 04)
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            Validated via CrossRef &amp; DOI Registry
          </span>
        </div>

        {citations.length === 0 ? (
          <p className="text-xs text-zinc-400 py-3">
            No academic citations, DOIs, or bibliographic references were detected in this input.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 text-[11px] font-mono text-zinc-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Cited Reference</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Matched Repository</th>
                  <th className="py-2.5 px-3">Validation Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {citations.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-mono text-[11px] max-w-xs truncate">
                      {c.raw_text}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase px-2 py-0.5 rounded-md border ${
                          c.status === "valid"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : c.status === "fabricated"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {c.status === "valid" ? (
                          <CheckCircle2 size={12} />
                        ) : c.status === "fabricated" ? (
                          <XCircle size={12} />
                        ) : (
                          <HelpCircle size={12} />
                        )}
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-200 hover:text-white underline flex items-center gap-1"
                        >
                          {c.source || "External Link"} <ExternalLink size={10} />
                        </a>
                      ) : (
                        c.source || "N/A"
                      )}
                    </td>
                    <td className="py-3 px-3 text-zinc-400">{c.note || "Audit complete."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Dashboard (Slide 06)
        </button>

        <button
          type="button"
          onClick={onNextToHistory}
          className="bg-white text-black font-semibold rounded-md px-6 py-2.5 text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-md cursor-pointer"
        >
          <span>Saved Reports &amp; History (Slide 08)</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
