import React from "react";
import { FileText, HelpCircle, Search, BookmarkCheck, BarChart3, ArrowRight, ShieldCheck, Check, Sparkles } from "lucide-react";

interface SlideArchitectureProps {
  onNext: () => void;
}

export function SlideArchitecture({ onNext }: SlideArchitectureProps) {
  const stages = [
    {
      num: "01",
      title: "Claim Extraction & NLP",
      lead: "Niranchan NS (25CU0310156)",
      desc: "Deconstructs raw AI text into atomic, independent claims using NLP sentence splitting. Classifies each statement as factual, statistical, historical, or subjective opinion.",
      icon: FileText,
      tag: "Sentence Tokenization",
    },
    {
      num: "02",
      title: "Independent Verification",
      lead: "Hemesh BL (25CU0310148)",
      desc: "Re-questions and reformulates each isolated claim into unbiased search queries to eliminate confirmation bias from the LLM's original phrasing.",
      icon: HelpCircle,
      tag: "Decontextualization",
    },
    {
      num: "03",
      title: "Source Cross-Check",
      lead: "Niranchan NS (25CU0310156)",
      desc: "Queries real-world external ground truth via Wikipedia REST API, DuckDuckGo Live Web Search, OpenAlex, and ArXiv to retrieve primary source excerpts and authoritative URLs.",
      icon: Search,
      tag: "Multi-Source Retrieval",
      isHighlight: true,
    },
    {
      num: "04",
      title: "Citation Validation",
      lead: "Kiran B Nambiyar (25CU0310114)",
      desc: "Checks references, DOIs, and URLs against CrossRef's 150M+ scholarly registry and official DOI resolvers to flag fabricated academic citations.",
      icon: BookmarkCheck,
      tag: "CrossRef / DOI Check",
    },
    {
      num: "05",
      title: "Scoring & Dashboard",
      lead: "Thanesh (25CU0310118)",
      desc: "Evaluates claim-evidence agreement, computes overall clinical confidence score (0-100%), renders semantic text highlights, and persists reports to SQLite.",
      icon: BarChart3,
      tag: "Evidence Synthesis",
    },
  ];

  const advantages = [
    "Catches multiple hallucination types (factual, numerical, citation) across dedicated stages",
    "Every flagged claim is traceable back to a verifiable external source URL",
    "Independent query formulation prevents inherited confirmation bias",
    "Real-time confidence scoring and interactive semantic highlighting for end users",
  ];

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-140px)] py-8 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-2 font-semibold">
          Slide 03 of 09 · Proposed Methodology
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Proposed 5-Stage Verification Pipeline
        </h1>
        <p className="mt-2 text-zinc-400 text-sm sm:text-base max-w-3xl">
          A sequential, modular architecture that addresses both factual errors and citation hallucinations
          in a single traceable workflow.
        </p>
      </div>

      {/* 5 Stages Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        {stages.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.num}
              className={`rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                st.isHighlight
                  ? "border border-purple-500/40 bg-[#0e0d17] shadow-[0_0_25px_rgba(168,85,247,0.12)] hover:border-purple-500/60"
                  : "border border-zinc-800/80 bg-[#0c0d12]/90 hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-mono text-xs font-bold ${st.isHighlight ? "text-purple-400" : "text-zinc-400"}`}>
                    STAGE {st.num}
                  </span>
                  <div className={`p-2 rounded-lg ${st.isHighlight ? "bg-purple-500/15 text-purple-300" : "bg-zinc-800/80 text-zinc-300"}`}>
                    <Icon size={16} />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-1 leading-snug">
                  {st.title}
                </h3>
                <span className={`text-[11px] font-mono block mb-2 font-medium ${st.isHighlight ? "text-purple-300" : "text-zinc-400"}`}>
                  {st.lead}
                </span>

                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">
                  {st.desc}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-zinc-800/60">
                <span className="text-[9px] font-mono uppercase tracking-wider bg-white/[0.04] text-zinc-400 px-2 py-0.5 rounded border border-white/5">
                  {st.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advantages Box */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-5 mb-6 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2 font-semibold">
          <ShieldCheck size={16} /> System Advantages (Slide 06 of Presentation)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {advantages.map((adv, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-zinc-200">
              <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{adv}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Step Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="bg-white text-black font-semibold rounded-md px-5 py-2.5 text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-md"
        >
          <span>Next: Live Verification Workstation</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
