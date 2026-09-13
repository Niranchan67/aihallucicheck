import React from "react";
import { FileText, CheckSquare, Search, Gauge, BookmarkCheck } from "lucide-react";

export function LandingArchitecture() {
  const stages = [
    {
      num: "01",
      name: "Input Analysis and Claim Extraction",
      lead: "Niranchan NS (25CU0310156)",
      leadColor: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
      icon: <FileText size={20} className="text-indigo-400" />,
      desc: "Deconstructs unstructured AI responses into atomic factual assertions using regex boundaries and syntactic clause segmentation.",
      metrics: "Sub-50ms extraction, sentence-level granularity",
    },
    {
      num: "02",
      name: "Per-Claim Classification",
      lead: "Modular Engine",
      leadColor: "border-zinc-700 bg-zinc-800/40 text-zinc-300",
      icon: <CheckSquare size={20} className="text-blue-400" />,
      desc: "Classifies assertions into 4 distinct verification types: Factual, Statistical/Numerical, Historical, or Subjective Opinion.",
      metrics: "Custom taxonomy for targeted query routing",
    },
    {
      num: "03",
      name: "Multi-Source Cross-Check",
      lead: "Niranchan NS (25CU0310156)",
      leadColor: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
      icon: <Search size={20} className="text-cyan-400" />,
      desc: "Generates neutral queries to poll Wikipedia REST API, DuckDuckGo Live Search, and scientific registries without prompt bias.",
      metrics: "Wikipedia REST + DuckDuckGo + Scholarly indexes",
    },
    {
      num: "04",
      name: "Confidence and Risk Scoring",
      lead: "Automated Scorer",
      leadColor: "border-zinc-700 bg-zinc-800/40 text-zinc-300",
      icon: <Gauge size={20} className="text-amber-400" />,
      desc: "Computes calibrated confidence scores from 0.0 to 1.0 based on corroboration ratio, source authority, and contradiction penalties.",
      metrics: "Mathematical index: Verified vs Suspicious vs Hallucinated",
    },
    {
      num: "05",
      name: "Citation and DOI Verification",
      lead: "Thanesh (25CU0310118)",
      leadColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      icon: <BookmarkCheck size={20} className="text-emerald-400" />,
      desc: "Cross-checks academic references against CrossRef Scholarly API and official DOI resolvers to detect phantom papers and fake authors.",
      metrics: "Direct CrossRef REST API & DOI resolver",
    },
  ];

  return (
    <section id="architecture" className="py-20 md:py-24 border-b border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            5-Stage Modular Verification Architecture
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            A pipeline combining natural language claim extraction with live external knowledge retrieval and scholarly metadata audits.
          </p>
        </div>

        {/* Bento Grid with 5 Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stages.map((stage, idx) => (
            <div
              key={stage.num}
              className={`rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 flex flex-col justify-between hover:border-zinc-700 transition-all ${
                idx === 2 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-md border border-zinc-800 bg-zinc-900">
                    {stage.icon}
                  </div>
                  <span className="font-mono text-xs text-zinc-400 font-semibold">
                    STAGE {stage.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{stage.name}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{stage.desc}</p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono">Module Lead:</span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[11px] border ${stage.leadColor}`}>
                    {stage.lead}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  {stage.metrics}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
