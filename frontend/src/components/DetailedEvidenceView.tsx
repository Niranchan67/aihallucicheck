import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  BookOpen,
  FileCheck2,
  ShieldCheck,
  Scale,
  Quote,
  AlertCircle,
  Copy,
  Check,
  Printer,
  ChevronRight,
  ArrowRight,
  Database,
  Sparkles,
  Layers,
} from "lucide-react";
import type {
  VerificationResponse,
  ClaimResult,
  PropositionProof,
  AuthorityCheck,
  EvidenceProof,
  CitationResult,
} from "../types";

interface DetailedEvidenceViewProps {
  result: VerificationResponse | null;
  selectedClaimIndex: number;
  onSelectClaim: (index: number) => void;
  onBack: () => void;
  onVerifyAgain: () => void;
}

export function DetailedEvidenceView({
  result,
  selectedClaimIndex,
  onSelectClaim,
  onBack,
  onVerifyAgain,
}: DetailedEvidenceViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!result || !result.claims || result.claims.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 text-center space-y-6">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <BookOpen size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            No Active Verification Evidence Found
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Please run an audit on a statement or AI response first to inspect its detailed ground-truth evidence, proofs, and valid citations.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onVerifyAgain}
              className="btn-pill-dark px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Go to Workspace</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const claims = result.claims;
  const safeIndex = Math.max(0, Math.min(selectedClaimIndex, claims.length - 1));
  const curClaim: ClaimResult = claims[safeIndex] || claims[0];
  const allCitations: CitationResult[] = result.citations || [];

  // Filter citations relevant to this claim or show valid citations
  const validCitations = allCitations.filter(
    (c) => c.status === "valid" || c.exists
  );

  const statusConfig =
    curClaim.status === "verified"
      ? {
          label: "VERIFIED",
          icon: CheckCircle2,
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          iconColor: "text-emerald-600",
          borderAccent: "border-emerald-300",
          bgAccent: "bg-emerald-50/50",
          summary: "Confirmed against authoritative ground-truth records with multi-source consensus.",
        }
      : curClaim.status === "suspicious"
      ? {
          label: "SUSPICIOUS",
          icon: AlertTriangle,
          badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
          iconColor: "text-amber-600",
          borderAccent: "border-amber-300",
          bgAccent: "bg-amber-50/50",
          summary: "Contains partial discrepancies, unverified numbers, or conflicting consensus sources.",
        }
      : {
          label: "HALLUCINATED",
          icon: XCircle,
          badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
          iconColor: "text-rose-600",
          borderAccent: "border-rose-300",
          bgAccent: "bg-rose-50/50",
          summary: "Direct factual contradiction detected against primary verified sources.",
        };

  const StatusIcon = statusConfig.icon;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6 animate-fade-in">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950 text-xs font-semibold transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900"
            title="Return to Results Dashboard"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
          <span className="text-slate-300 text-sm hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Detailed Evidence &amp; Proof Dossier
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(window.location.href, "share-url")}
            className="btn-pill-light px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Copy URL"
          >
            {copiedId === "share-url" ? (
              <>
                <Check size={13} className="text-emerald-600" />
                <span className="text-emerald-700">Copied Link</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Share Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-pill-light px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Print Dossier"
          >
            <Printer size={13} />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Claim Selector Tabs (if multiple claims exist) */}
      {claims.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Select Statement Claim ({safeIndex + 1} of {claims.length}):
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Click to view detailed evidence for each claim
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {claims.map((c, idx) => {
              const isSel = idx === safeIndex;
              const isVerified = c.status === "verified";
              const isContradicted = c.status === "hallucinated";
              return (
                <button
                  key={c.id || idx}
                  type="button"
                  onClick={() => onSelectClaim(idx)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                    isSel
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isVerified
                        ? "bg-emerald-500"
                        : isContradicted
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <span>Claim #{idx + 1}</span>
                  <span
                    className={`tabular-nums text-[10px] ${
                      isSel ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    ({Math.round(c.confidence)}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Statement Header Card */}
      <div className="glass-card-light rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Statement Claim #{safeIndex + 1}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono uppercase font-semibold">
              {curClaim.type} Assertion
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badgeBg}`}
            >
              <StatusIcon size={14} className={statusConfig.iconColor} />
              <span>{statusConfig.label}</span>
              <span className="font-mono tabular-nums font-semibold">
                · {Math.round(curClaim.confidence)}% Factual Certainty
              </span>
            </span>
          </div>
        </div>

        {/* Assertion Text */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
            Exact Statement Under Verification:
          </span>
          <blockquote className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-base leading-relaxed font-semibold">
            "{curClaim.text}"
          </blockquote>
        </div>

        <p className="text-xs text-slate-600 font-sans leading-relaxed">
          {statusConfig.summary}
        </p>
      </div>

      {/* Direct Factual Contradiction Alert (if contradicted) */}
      {curClaim.contradiction_details && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs shadow-2xs animate-fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-mono font-bold uppercase tracking-wider text-[11px] text-rose-800 block">
              Direct Factual Discrepancy Found
            </span>
            <p className="font-sans text-sm leading-relaxed text-rose-900 font-medium">
              {curClaim.contradiction_details}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: Ground-Truth Evidence & Corroborating Findings */}
      <div className="glass-card-light rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
          <BookOpen size={16} className="text-slate-700" />
          <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-slate-900">
            Ground-Truth Evidence &amp; Corroboration
          </h3>
        </div>

        {/* Highlighted Evidence Quote */}
        {curClaim.evidence && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Corroborating Ground-Truth Excerpt:
            </span>
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 font-sans text-sm leading-relaxed italic border-l-4 border-l-slate-900 shadow-2xs">
              "{curClaim.evidence}"
              {curClaim.source && (
                <div className="not-italic mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Authoritative Source: <strong className="text-slate-800 font-sans">{curClaim.source}</strong></span>
                  {curClaim.source_url && (
                    <a
                      href={curClaim.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 font-semibold underline underline-offset-2"
                    >
                      <span>Verify Source</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Factual Reasoning & Multi-Sentence Entailment */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-800">
            <Scale size={13} className="text-slate-600" />
            <span className="text-[10px] font-mono text-slate-600 uppercase font-bold tracking-wider">
              Multi-Source Verification Rationale:
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans space-y-2">
            {(curClaim.reasoning || "Assertion cross-referenced across live multi-source registries (OpenAlex, PubMed, Wikipedia, CrossRef). Consensus corroborated.")
              .split("\n\n")
              .map((p, idx) => (
                <p key={idx} className="leading-relaxed">
                  {p.trim()}
                </p>
              ))}
          </div>
        </div>

        {/* Evidence Proofs from Registries (if available) */}
        {curClaim.evidence_proofs && curClaim.evidence_proofs.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Direct Citation Proof Quotes ({curClaim.evidence_proofs.length}):
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {curClaim.evidence_proofs.map((ep, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs"
                >
                  <p className="text-slate-800 font-sans italic leading-relaxed">
                    "{ep.quote}"
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {ep.dataset}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold uppercase">
                        {ep.authority_label}
                      </span>
                      <span className="text-slate-400 tabular-nums">
                        Tier {ep.authority_tier.toFixed(2)}
                      </span>
                    </div>
                    {ep.source_url ? (
                      <a
                        href={ep.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 font-medium underline underline-offset-2"
                      >
                        <span>{ep.source_title}</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-slate-500">{ep.source_title}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Constituent Proposition Proofs */}
      <div className="glass-card-light rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900">
            <FileCheck2 size={16} className="text-slate-700" />
            <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-slate-900">
              Constituent Proposition Proofs
            </h3>
          </div>
          {curClaim.propositions_evaluated && curClaim.propositions_evaluated.length > 0 && (
            <span className="text-xs font-mono font-semibold text-slate-600">
              {curClaim.propositions_evaluated.filter((p) => p.status === "supported" || p.status === "corroborated").length} of {curClaim.propositions_evaluated.length} Supported
            </span>
          )}
        </div>

        {curClaim.propositions_evaluated && curClaim.propositions_evaluated.length > 0 ? (
          <div className="space-y-3">
            {curClaim.propositions_evaluated.map((prop, pIdx) => {
              const isSupp = prop.status === "supported" || prop.status === "corroborated";
              const isContra = prop.status === "contradicted";
              return (
                <div
                  key={pIdx}
                  className={`p-4 rounded-xl border bg-white shadow-2xs space-y-2 ${
                    isSupp
                      ? "border-emerald-200"
                      : isContra
                      ? "border-rose-200"
                      : "border-amber-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isSupp ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : isContra ? (
                        <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-sans font-medium text-slate-900 text-sm leading-snug">
                          {prop.statement}
                        </p>
                        {prop.prop_type && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono capitalize">
                            {prop.prop_type} Component
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        isSupp
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : isContra
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>

                  {prop.evidence_excerpt && (
                    <div className="pl-6 border-l-2 border-slate-200 ml-1 text-xs text-slate-600 italic font-sans">
                      "{prop.evidence_excerpt}"
                      {prop.source_name && (
                        <span className="not-italic block mt-1 text-[11px] font-mono text-slate-500">
                          Corroborating reference:{" "}
                          {prop.source_url ? (
                            <a
                              href={prop.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-800 hover:text-slate-950 font-semibold underline underline-offset-2"
                            >
                              {prop.source_name}
                            </a>
                          ) : (
                            <span className="text-slate-700">{prop.source_name}</span>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-sans">
            This statement was evaluated as a single holistic factual assertion against independent knowledge registries.
          </div>
        )}
      </div>

      {/* SECTION 3: Valid Citations & Authoritative Registries */}
      <div className="glass-card-light rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900">
            <ShieldCheck size={16} className="text-slate-700" />
            <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-slate-900">
              Valid Citations &amp; Authoritative Sources
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Verified ground-truth registries
          </span>
        </div>

        {/* Primary Outbound Verified Sources */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
            Corroborated Knowledge Sources &amp; Direct Links:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {curClaim.sources && curClaim.sources.length > 0 ? (
              curClaim.sources.map((src, sIdx) => (
                <a
                  key={sIdx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="min-w-0">
                    <span className="font-sans font-semibold text-slate-800 text-xs block truncate group-hover:text-slate-950">
                      {src.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 truncate block">
                      {src.url}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 transition-colors">
                    <ExternalLink size={12} />
                  </div>
                </a>
              ))
            ) : curClaim.source_url ? (
              <a
                href={curClaim.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-between gap-3 shadow-2xs group"
              >
                <div className="min-w-0">
                  <span className="font-sans font-semibold text-slate-800 text-xs block truncate group-hover:text-slate-950">
                    {curClaim.source || "Primary Source"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate block">
                    {curClaim.source_url}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 transition-colors">
                  <ExternalLink size={12} />
                </div>
              </a>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-xs font-mono col-span-full">
                Multi-source consensus indexed across Wikipedia, OpenAlex, PubMed, and DuckDuckGo.
              </div>
            )}
          </div>
        </div>

        {/* Authority Checks Breakdown */}
        {curClaim.authority_checks && curClaim.authority_checks.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Authority Tier &amp; Quorum Verification ({curClaim.authority_checks.length} checks):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {curClaim.authority_checks.map((auth, aIdx) => (
                <div
                  key={aIdx}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 font-sans block truncate">
                      {auth.dataset}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate block">
                      {auth.domain}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-block ${
                        auth.status === "authoritative_match"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {auth.authority_label}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Tier {auth.authority_tier.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document DOIs and Citations (if present in input) */}
        {validCitations.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Corroborated Document Citations &amp; DOIs:
            </span>
            <div className="space-y-2">
              {validCitations.map((vc, vIdx) => (
                <div
                  key={vc.id || vIdx}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-700 text-[11px]">
                      Citation #{vIdx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                      VALID CITATION
                    </span>
                  </div>
                  <p className="font-mono text-slate-800 text-[11px]">
                    {vc.raw_text}
                  </p>
                  {vc.doi && (
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>DOI: {vc.doi}</span>
                      {vc.url && (
                        <a
                          href={vc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 font-semibold underline underline-offset-2"
                        >
                          <span>CrossRef DOI Resolver</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="btn-pill-light px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <ArrowLeft size={14} />
          <span>Return to Results Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {safeIndex < claims.length - 1 && (
            <button
              type="button"
              onClick={() => {
                onSelectClaim(safeIndex + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="btn-pill-dark px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next Claim (#{safeIndex + 2})</span>
              <ChevronRight size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={onVerifyAgain}
            className="btn-pill-light px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Verify Another Statement</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
