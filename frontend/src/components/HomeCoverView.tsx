import React, { useState } from "react";
import {
  Shield,
  ArrowRight,
  BarChart3,
  History,
  FileText,
  Search,
  BookOpen,
  Cpu,
  ChevronRight,
  Layers,
  Terminal,
  Sparkles,
} from "lucide-react";
import type { AppTab, AiModel, VerificationRequest } from "../types";

interface HomeCoverViewProps {
  onNavigate: (tab: AppTab) => void;
  onStartVerification: (req: VerificationRequest) => void;
  hasActiveResult: boolean;
  historyCount: number;
}

const MODEL_OPTIONS: { id: AiModel; name: string }[] = [
  { id: "chatgpt", name: "GPT-4o" },
  { id: "claude", name: "Claude 3.5" },
  { id: "gemini", name: "Gemini 1.5" },
  { id: "llama", name: "Llama 3.3" },
  { id: "other", name: "Other" },
];

export function HomeCoverView({
  onNavigate,
  onStartVerification,
  hasActiveResult,
  historyCount,
}: HomeCoverViewProps) {
  const [statementText, setStatementText] = useState("");
  const [selectedModel, setSelectedModel] = useState<AiModel>("chatgpt");

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementText.trim()) return;

    onStartVerification({
      text: statementText.trim(),
      model: selectedModel,
      verify_claims: true,
      verify_citations: true,
      verify_statistics: true,
    });
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12 animate-fade-in">
      {/* 1. Hero Branding & Overview Card */}
      <div className="glass-card-light rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-6 relative z-10">
          {/* Engine Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 emerald-pulse" />
            <span className="font-mono text-[11px] tracking-wide">
              MULTI-SOURCE VERIFICATION ENGINE V2.0
            </span>
          </div>

          {/* Titles */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-sans leading-tight">
              HalluciCheck
            </h1>
            <p className="text-lg sm:text-xl font-semibold text-slate-700 font-sans">
              AI Hallucination Verification Engine
            </p>
          </div>

          {/* Professional Overview */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-sans">
            Paste any statement or AI-generated output to thoroughly decompose assertions, cross-reference
            multiple authoritative knowledge registries (OpenAlex, PubMed, ArXiv, DuckDuckGo Web Search, CrossRef, and Wikipedia),
            and inspect calibrated factual certainty with exact sentence highlights.
          </p>

          {/* Quick CTA row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate("workspace")}
              className="btn-pill-dark px-6 py-3 text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <span>Open Verification Workspace</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="btn-pill-light px-5 py-3 text-sm font-semibold flex items-center gap-2"
            >
              <BarChart3 size={16} className="text-slate-600" />
              <span>{hasActiveResult ? "View Live Dashboard" : "Open Dashboard"}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("history")}
              className="btn-pill-light px-5 py-3 text-sm font-semibold flex items-center gap-2"
            >
              <History size={16} className="text-slate-600" />
              <span>Audit History ({historyCount})</span>
            </button>
          </div>
        </div>

        {/* Decorative background watermark badge */}
        <div className="hidden lg:block absolute -right-8 -bottom-10 opacity-5 pointer-events-none text-slate-900">
          <Shield size={320} strokeWidth={1} />
        </div>
      </div>

      {/* 2. Direct Statement Analysis Console (Paste & Analyze) */}
      <div className="glass-card-light rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Terminal size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">
                Analyze Any Statement Thoroughly
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Paste any text to query independent evidence across OpenAlex, PubMed, ArXiv, DuckDuckGo &amp; Wikipedia
              </p>
            </div>
          </div>

          {/* Model Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
            <span className="text-[10px] font-mono text-slate-500 px-2 font-bold">MODEL:</span>
            {MODEL_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedModel === m.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleQuickSubmit} className="space-y-4">
          <div className="relative rounded-2xl border border-slate-200 bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-900/5 transition-all shadow-2xs">
            <textarea
              rows={4}
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              placeholder="Paste any statement, raw AI output, scientific assertion, or research text to analyze thoroughly against legit ground-truth sources…"
              className="w-full bg-transparent p-4 sm:p-5 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none font-sans leading-relaxed resize-y min-h-[120px]"
            />

            <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/60 rounded-b-2xl flex items-center justify-between text-xs">
              <div className="text-[11px] font-mono text-slate-500">
                <span>{statementText.trim() ? statementText.trim().split(/\s+/).length : 0} words</span>
                <span className="mx-2">·</span>
                <span>{statementText.length} characters</span>
              </div>

              <div className="flex items-center gap-2">
                {statementText && (
                  <button
                    type="button"
                    onClick={() => setStatementText("")}
                    className="text-slate-500 hover:text-rose-600 text-xs font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clip = await navigator.clipboard.readText();
                      if (clip) setStatementText(clip);
                    } catch {}
                  }}
                  className="text-xs text-slate-700 hover:text-slate-950 font-semibold bg-white border border-slate-200 px-2.5 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                >
                  Paste Clipboard
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Multi-source consensus ready</span>
            </div>

            <button
              type="submit"
              disabled={!statementText.trim()}
              className="btn-pill-dark px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Thoroughly Analyze Statement</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* 3. Navigation Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-sans uppercase">
            Workspace Modules
          </h2>
          <span className="text-xs text-slate-500 font-mono">Direct application access</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Text Verification */}
          <div className="glass-card-light rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <FileText size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-sans group-hover:text-slate-800">
                Verification Workspace
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Full-featured analysis input console with configurable claim extraction, citation audits,
                and statistical verification controls.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate("workspace")}
                className="w-full btn-pill-dark py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>Open Analysis Workspace</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 2: Live Dashboard */}
          <div className="glass-card-light rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-sans group-hover:text-slate-800">
                Results Dashboard
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Inspect the Overall Certainty Ring, 4 factual KPI metrics, sentence-level highlighted text viewer,
                and legitimate cross-source references.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className="w-full btn-pill-light py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>{hasActiveResult ? "Inspect Active Report" : "Explore Dashboard"}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 3: Audit History */}
          <div className="glass-card-light rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <History size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-sans group-hover:text-slate-800">
                Audit History &amp; Logs
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Review past verification sessions saved across your browser sessions. Filter by origin model
                or keyword, and export comprehensive JSON findings.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate("history")}
                className="w-full btn-pill-light py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>Browse Session Logs ({historyCount})</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Multi-Source Ground Truth Engine Strip */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-slate-700" />
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-sans uppercase">
            Authoritative Consensus Quorum (Beyond Wikipedia)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card-light rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              OpenAlex &amp; IEEE / Nature
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Queries 250M+ scholarly works from Nature, IEEE, Springer, and ACM to audit academic assertions.
            </p>
          </div>

          <div className="glass-card-light rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Search size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              Europe PMC / PubMed
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Cross-checks biomedical and life-science claims against PubMed Central and NIH publications.
            </p>
          </div>

          <div className="glass-card-light rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Cpu size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              ArXiv Preprints &amp; CS
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Verifies computer science, AI, physics, and mathematical claims against Cornell University preprints.
            </p>
          </div>

          <div className="glass-card-light rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Search size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              DuckDuckGo Live Search
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Pulls live open web index results across verified domains to corroborate contemporary facts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
