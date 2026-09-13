import React, { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function LandingProblem() {
  const [viewMode, setViewMode] = useState<"raw" | "verified">("verified");

  return (
    <section id="problem" className="py-20 md:py-24 border-b border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            The Problem: Unchecked LLM Hallucinations in Research and Production
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Large Language Models generate text based on probabilistic token prediction, not verified knowledge.
            When queried for factual knowledge or academic research, models routinely invent citations, distort numbers, and state falsehoods with absolute confidence.
          </p>
        </div>

        {/* 3 Core Failure Vectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6 hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 font-mono font-bold text-sm">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Statistical Distortion</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              LLMs hallucinate realistic-sounding percentages, survey counts, and scientific benchmarks that do not exist in the source literature.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6 hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 font-mono font-bold text-sm">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Phantom Academic Citations</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              AI models stitch together real author names with fabricated journal titles and fake DOIs, creating convincing citations that fail upon lookup.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6 hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 font-mono font-bold text-sm">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ungrounded Factual Certainty</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Current AI outputs lack external trace anchors, forcing human researchers to spend hours manually searching Google and academic portals.
            </p>
          </div>
        </div>

        {/* Interactive Comparison Block */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/90 overflow-hidden shadow-xl">
          <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 p-4 bg-zinc-900/50 gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-400">COMPARISON BENCHMARK:</span>
              <span className="text-xs font-semibold text-white">Quantum Computing Breakthrough Claim</span>
            </div>

            <div className="flex items-center gap-1 rounded-md bg-zinc-950 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-3 py-1 text-xs rounded transition-all font-medium ${
                  viewMode === "raw" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                }`}
              >
                Raw LLM Response
              </button>
              <button
                type="button"
                onClick={() => setViewMode("verified")}
                className={`px-3 py-1 text-xs rounded transition-all font-medium ${
                  viewMode === "verified" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                }`}
              >
                HalluciCheck Grounded Audit
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {viewMode === "raw" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono">
                  <AlertTriangle size={14} />
                  <span>UNVERIFIED RAW MODEL GENERATION (NO EXTERNAL VERIFICATION)</span>
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  In 2024, researchers achieved 100% fault-tolerant quantum supremacy using 5,000 logical qubits at room temperature.
                  According to Dr. Elizabeth Foster in Nature Quantum (2024, doi:10.1038/s41586-024-99999-x), this completely replaces classical cryptography within 12 months.
                </p>
                <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                  Risk Warning: Readers have no indicator that the DOI is fabricated and room-temperature claim contradicts known physics.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 size={14} />
                  <span>HALLUCICHECK MULTI-STAGE ANALYSIS RESULTS</span>
                </div>
                <div className="p-4 rounded bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-red-400">CLAIM 1: 100% fault-tolerant quantum supremacy at room temperature</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      HALLUCINATED (Confidence 0.12)
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    CrossRef and Wikipedia physics registries show logical qubits require sub-Kelvin cryogenic dilution refrigerators. No room-temperature record exists.
                  </p>
                </div>

                <div className="p-4 rounded bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-red-400">CITATION AUDIT: Nature Quantum (doi:10.1038/s41586-024-99999-x)</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      INVALID DOI / FABRICATED
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Query against CrossRef REST API returned HTTP 404. Neither the DOI prefix nor the specific paper exists in the official scholarly catalog.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
