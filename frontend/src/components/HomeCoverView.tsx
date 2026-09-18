import React from "react";
import {
  Shield,
  ArrowRight,
  Sparkles,
  BarChart3,
  History,
  FileText,
  Search,
  BookOpen,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Layers,
} from "lucide-react";
import type { AppTab, AiModel, VerificationRequest } from "../types";

interface HomeCoverViewProps {
  onNavigate: (tab: AppTab) => void;
  onSelectPreset: (text: string, model: AiModel) => void;
  onStartVerification: (req: VerificationRequest) => void;
  hasActiveResult: boolean;
  historyCount: number;
}

export const DIAGNOSTIC_PRESETS = [
  {
    title: "Science & Physics Violation",
    badge: "Physics",
    model: "chatgpt" as AiModel,
    desc: "Checks specific heat of water vs standard model faster-than-light violation.",
    text: "The specific heat capacity of water is 4.184 J/g C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances.",
  },
  {
    title: "History & Chronology Check",
    badge: "Chronology",
    model: "claude" as AiModel,
    desc: "Validates historical milestones, construction dates, and geographical capitals.",
    text: "Paris is the capital and most populous city of France. The Eiffel Tower was constructed from 1887 to 1889 as the centerpiece of the 1889 World Fair.",
  },
  {
    title: "Academic Citation & DOI Audit",
    badge: "Citation / DOI",
    model: "gemini" as AiModel,
    desc: "Verifies scholarly citations and paper authorship against CrossRef registries.",
    text: "Transformer neural networks replace recurrent loops with self-attention mechanisms. Vaswani, A. (2017). Attention Is All You Need. NeurIPS.",
  },
  {
    title: "Severe Hallucination Trap",
    badge: "High Risk",
    model: "other" as AiModel,
    desc: "Tests fabricated historical dates and impossible space exploration claims.",
    text: "Python was invented in 2024 by Elon Musk. In 1985, NASA astronauts landed directly on the solid diamond core of Jupiter during Apollo 18.",
  },
];

export function HomeCoverView({
  onNavigate,
  onSelectPreset,
  onStartVerification,
  hasActiveResult,
  historyCount,
}: HomeCoverViewProps) {
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
            Autonomous multi-source verification workspace designed to eliminate AI confabulation.
            HalluciCheck decomposes complex LLM generations into atomic claims, cross-references
            assertions against independent open-knowledge authorities (Wikipedia REST, DuckDuckGo Live Search, CrossRef DOIs),
            and computes calibrated certainty tiers with deep diagnostic rationale.
          </p>

          {/* Quick CTA row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate("workspace")}
              className="btn-pill-dark px-6 py-3 text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <span>Start Text Verification</span>
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

      {/* 2. Quick Action Navigation Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-sans uppercase">
            Workspace Modules
          </h2>
          <span className="text-xs text-slate-500 font-mono">Instant view navigation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Text Verification */}
          <div className="glass-card-light rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <FileText size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-sans group-hover:text-slate-800">
                Start Text Verification
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Paste any model response from ChatGPT, Claude, Gemini, or Llama. Configure claim decomposition,
                citation audit, and statistical checks before launching verification.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate("workspace")}
                className="w-full btn-pill-dark py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>Launch Analysis Console</span>
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
                View Live Dashboard
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Inspect the Overall Certainty Ring, 4 factual KPI metrics, sentence-level highlighted text viewer,
                and CrossRef DOI validation reports.
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
                Review past verification sessions saved via the localStorage data bridge. Filter by origin model
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

      {/* 3. Diagnostic Test Presets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-slate-700" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-sans uppercase">
              One-Click Diagnostic Presets
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Immediate benchmark samples</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DIAGNOSTIC_PRESETS.map((preset, idx) => (
            <div
              key={idx}
              className="glass-card-light rounded-xl p-5 border border-slate-200/80 hover:border-slate-400/80 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                    {preset.badge}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {preset.model}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                  {preset.title}
                </h3>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                  {preset.desc}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset.text, preset.model);
                    onNavigate("workspace");
                  }}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 cursor-pointer"
                >
                  <span>Load into Console</span>
                  <ArrowRight size={12} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onStartVerification({
                      text: preset.text,
                      model: preset.model,
                      verify_claims: true,
                      verify_citations: true,
                      verify_statistics: true,
                    });
                  }}
                  className="btn-pill-dark text-[11px] px-2.5 py-1 font-semibold"
                  title="Run verification immediately"
                >
                  Audit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Multi-Source Ground Truth Engine Strip */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-slate-700" />
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-sans uppercase">
            Multi-Source Consensus Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card-light rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Search size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              01 · Wikipedia REST &amp; Open Web
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Queries encyclopedia abstracts and DuckDuckGo Live Search to retrieve corroborating evidence
              without model confirmation bias.
            </p>
            <div className="text-[10px] font-mono text-emerald-700 font-semibold pt-1">
              Active live consensus checking
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              02 · CrossRef DOI &amp; Paper Audit
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Detects phantom citations, fabricated journal references, and invalid DOIs by querying the
              official CrossRef scholarly metadata registry.
            </p>
            <div className="text-[10px] font-mono text-blue-700 font-semibold pt-1">
              CrossRef REST API connected
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
              <Cpu size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              03 · Calibrated Certainty Engine
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Calculates calibrated 0–100% certainty scores and categorizes risk into High Certainty,
              Moderate Risk, or High Hallucination Risk tiers.
            </p>
            <div className="text-[10px] font-mono text-purple-700 font-semibold pt-1">
              Deterministic mathematical scoring
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
