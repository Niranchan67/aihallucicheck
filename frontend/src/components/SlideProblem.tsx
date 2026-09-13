import React from "react";
import { AlertTriangle, Users, Target, CheckCircle2, ArrowRight, BookOpen, Building2, Scale, Newspaper } from "lucide-react";

interface SlideProblemProps {
  onNext: () => void;
}

export function SlideProblem({ onNext }: SlideProblemProps) {
  const problemPillars = [
    {
      num: "01",
      title: "What is the problem?",
      desc: "LLMs generate plausible-sounding but factually incorrect content — fabricated citations, invented statistics, and confidently wrong claims — with no built-in mechanism to tell fact from fiction.",
      icon: AlertTriangle,
      tone: "border-rose-500/30 text-rose-400 bg-rose-500/10",
    },
    {
      num: "02",
      title: "Who is affected?",
      desc: "Students and researchers writing papers, journalists drafting publications, enterprises deploying customer-facing AI bots, and everyday users consuming unverified AI answers.",
      icon: Users,
      tone: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    },
    {
      num: "03",
      title: "Why solve it?",
      desc: "Unchecked hallucinations spread misinformation at scale, erode public trust in AI systems, and can cause catastrophic financial, legal, medical, or reputational harm.",
      icon: Target,
      tone: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
    },
  ];

  const domains = [
    { title: "Education & Academia", desc: "Verifying facts and citations in academic writing and preprints.", icon: BookOpen },
    { title: "Journalism & Media", desc: "Fact-checking AI-drafted articles before publishing to the public.", icon: Newspaper },
    { title: "Enterprise Chatbots", desc: "Flagging unreliable answers in customer-facing business assistants.", icon: Building2 },
    { title: "Legal & Medical Review", desc: "Catching fabricated case law, clinical stats, or dosage claims.", icon: Scale },
  ];

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-140px)] py-8 max-w-5xl mx-auto px-4">
      {/* Slide Header */}
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-2 font-semibold">
          Slide 02 of 09 · Context &amp; Significance
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Problem Statement &amp; Need for the Project
        </h1>
        <p className="mt-2 text-zinc-400 text-sm sm:text-base max-w-3xl">
          Large language models sound remarkably confident while being completely wrong.
          Automated verification against independent ground-truth is essential for trust.
        </p>
      </div>

      {/* 3 Pillars Grid (Direct from Slide 3 of PDF) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {problemPillars.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.num}
              className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-6 relative flex flex-col justify-between hover:border-zinc-700 hover:-translate-y-0.5 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-zinc-500">
                    STAGE // {p.num}
                  </span>
                  <div className={`p-2 rounded-lg border ${p.tone}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Applications / Impact (Direct from Slide 8 of PDF) */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-6 mb-8 shadow-lg">
        <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2 font-semibold">
          <CheckCircle2 size={16} className="text-emerald-400" /> High-Stakes Target Application Domains
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {domains.map((d, i) => {
            const Icon = d.icon;
            return (
              <div key={i} className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-3.5">
                <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                  <Icon size={16} className="text-indigo-400" />
                  <span>{d.title}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">{d.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Step Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="bg-white text-black font-semibold rounded-md px-5 py-2.5 text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-md"
        >
          <span>Next: Explore 5-Stage Architecture</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
