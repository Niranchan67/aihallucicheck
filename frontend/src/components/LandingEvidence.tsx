import React, { useState } from "react";
import { ExternalLink, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { VerificationResponse } from "../types";

interface LandingEvidenceProps {
  result: VerificationResponse | null;
}

export function LandingEvidence({ result }: LandingEvidenceProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "verified" | "suspicious" | "hallucinated">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fallbackClaims = [
    {
      id: "demo-1",
      text: "The specific heat capacity of water is 4.184 J/g C at room temperature.",
      type: "statistical",
      status: "verified",
      confidence: 0.96,
      source: "Wikipedia: Properties of water",
      source_url: "https://en.wikipedia.org/wiki/Properties_of_water",
      evidence: "Water has a specific heat capacity of 4.184 J/(g K) at 20 degrees Celsius, among the highest of any liquid.",
      reasoning: "Corroborated by Wikipedia chemical registry and NIST thermochemical data tables.",
    },
    {
      id: "demo-2",
      text: "Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances.",
      type: "factual",
      status: "hallucinated",
      confidence: 0.08,
      source: "Wikipedia: No-communication theorem",
      source_url: "https://en.wikipedia.org/wiki/No-communication_theorem",
      evidence: "The no-communication theorem states that in quantum mechanics, measurement of an entangled state cannot be used to transmit classical information instantaneously.",
      reasoning: "Contradicts the no-communication theorem and special relativity.",
    },
    {
      id: "demo-3",
      text: "Attention Is All You Need (Vaswani et al., 2017) introduced the Transformer neural network architecture.",
      type: "historical",
      status: "verified",
      confidence: 0.99,
      source: "CrossRef Scholarly Catalog (DOI: 10.48550/arXiv.1706.03762)",
      source_url: "https://doi.org/10.48550/arXiv.1706.03762",
      evidence: "Vaswani, A., et al. (2017). Attention is all you need. Advances in Neural Information Processing Systems.",
      reasoning: "Verified through official academic metadata index and arXiv repository.",
    },
  ];

  const displayClaims = result?.claims?.length ? result.claims : fallbackClaims;
  const filtered = displayClaims.filter((c) => (activeFilter === "all" ? true : c.status === activeFilter));

  return (
    <section id="evidence" className="py-20 md:py-24 border-b border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Ground Truth Traceability and Evidence Explorer
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Every verification is backed by verifiable external sources.
            Inspect extracted evidence passages, source URLs, and CrossRef metadata checks.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1.5 rounded-md bg-zinc-950 p-1 border border-zinc-800">
            {(["all", "verified", "suspicious", "hallucinated"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all ${
                  activeFilter === tab
                    ? "bg-zinc-800 text-white font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-zinc-400">
            Showing {filtered.length} of {displayClaims.length} evaluated assertions
          </div>
        </div>

        {/* Claims Evidence Cards Stack */}
        <div className="space-y-4">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-5 hover:border-zinc-700 transition-all"
              >
                <div
                  className="flex flex-wrap items-start justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          c.status === "verified"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : c.status === "suspicious"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {c.status === "verified" && <CheckCircle2 size={10} />}
                        {c.status === "suspicious" && <AlertTriangle size={10} />}
                        {c.status === "hallucinated" && <XCircle size={10} />}
                        <span>{c.status}</span>
                      </span>
                      <span className="text-xs font-mono text-zinc-400 uppercase">{c.type}</span>
                    </div>

                    <p className="text-sm text-zinc-100 font-medium leading-relaxed font-sans">
                      "{c.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <div className="text-xs text-zinc-300">
                        {Math.round((c.confidence || 0) * 100)}%
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase">Confidence</div>
                    </div>
                    <button type="button" className="p-1 text-zinc-400 hover:text-white">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3 font-sans text-xs">
                    {c.evidence && (
                      <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800">
                        <span className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">
                          Retrieved Reference Text:
                        </span>
                        <p className="text-zinc-300 leading-relaxed font-sans">{c.evidence}</p>
                      </div>
                    )}

                    {c.reasoning && (
                      <div className="text-zinc-400 leading-relaxed">
                        <strong className="text-zinc-300 font-mono text-[11px]">Reasoning: </strong>
                        {c.reasoning}
                      </div>
                    )}

                    {c.source && (
                      <div className="flex flex-wrap items-center justify-between pt-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-900 gap-2">
                        <span>Authority: {c.source}</span>
                        {c.source_url && (
                          <a
                            href={c.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                          >
                            <span>Open Direct Source</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
