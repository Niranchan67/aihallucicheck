import React from "react";
import { BookOpen, Cpu, Layers, GitFork, ArrowRight, RotateCcw, CheckCircle2 } from "lucide-react";

interface SlideResearchProps {
  onGoToSlide: (slide: number) => void;
}

export function SlideResearch({ onGoToSlide }: SlideResearchProps) {
  const papers = [
    {
      title: "Seeing Through the Fog: Cost-Effectiveness Analysis of Hallucination Detection Systems",
      year: "2024",
      limitation: "Higher-performing detection systems come with much greater compute cost — the cost/accuracy trade-off remains unresolved.",
    },
    {
      title: "Chain-of-Verification Reduces Hallucination in LLMs (CoVe)",
      year: "2023",
      limitation: "Requires multiple sequential LLM calls, increasing latency and cost; verification questions can themselves be flawed.",
    },
    {
      title: "HalluciNot: Hallucination Detection Through Context and Common-Knowledge Verification",
      year: "2025",
      limitation: "Tuned for enterprise text with a fixed taxonomy; generalization to open-domain or creative content is limited.",
    },
    {
      title: "CheckIfExist: Detecting Citation Hallucinations in AI-Generated Content",
      year: "2026",
      limitation: "Addresses only citation/reference hallucinations, not factual or numerical hallucinations in body text.",
    },
    {
      title: "HaluCheck: Explainable and Verifiable Automation for Detecting Hallucinations",
      year: "2025",
      limitation: "Relies on GPT-4 itself as judging model which can hallucinate; focuses on visualization rather than multi-source correction.",
    },
  ];

  const techStack = [
    {
      category: "Core & NLP",
      tools: ["Python 3.14", "spaCy & Sentence Tokenizers", "Google Gemini / LLM Reasoning", "Pydantic v2"],
    },
    {
      category: "Retrieval & Ground Truth",
      tools: ["Wikipedia REST API", "DuckDuckGo Live Search API", "Multi-Source Parallel Gather", "Instant Answers Engine"],
    },
    {
      category: "Citation & Scholarly Data",
      tools: ["CrossRef Works Search API", "Semantic Scholar Graph API", "DOI.org Official Resolver", "Async HTTP HEAD/GET"],
    },
    {
      category: "Backend & Data",
      tools: ["FastAPI Async Router", "SQLAlchemy 2.0 ORM", "SQLite Durable Storage", "Uvicorn ASGI Engine"],
    },
    {
      category: "Frontend & UI",
      tools: ["React 18 + TypeScript", "Vite Bundler", "Tailwind CSS Dark Theme", "Interactive Slide Deck UI"],
    },
  ];

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-140px)] py-6 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-1 font-semibold">
          Slide 09 of 09 · Literature Survey &amp; Technical Foundation
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Literature Survey &amp; Research Gap
        </h1>
        <p className="mt-1 text-zinc-400 text-xs sm:text-sm">
          Existing benchmarks treat factual hallucination and citation fabrication separately.
          HalluciCheck bridges this gap in a single, multi-source pipeline.
        </p>
      </div>

      {/* Research Gap Box (Slide 10 of PDF) */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-5 mb-6 shadow-xl">
        <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1 font-semibold">
          Research Gap Addressed (Slide 10 of Presentation)
        </span>
        <h3 className="text-sm font-bold text-white mb-2">
          The Need for Unified, Traceable, Real-Time Verification
        </h3>
        <p className="text-xs text-zinc-300 leading-relaxed">
          "Current research treats hallucination detection and citation checking as separate problems.
          There is no unified, traceable pipeline that verifies both factual claims and their sources
          at a cost and latency efficient enough for real-time production use."
        </p>
      </div>

      {/* Literature Survey Matrix (Slide 09 of PDF) */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-5 mb-6 space-y-3 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300 flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-400" /> Literature Survey Matrix (2023–2026)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 text-[11px] font-mono text-zinc-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Paper Title</th>
                <th className="py-2.5 px-3 w-16">Year</th>
                <th className="py-2.5 px-3">Identified Limitation &amp; Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {papers.map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 font-medium text-white max-w-xs">{p.title}</td>
                  <td className="py-2.5 px-3 font-mono text-indigo-400">{p.year}</td>
                  <td className="py-2.5 px-3 text-zinc-400 leading-relaxed">{p.limitation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technologies Used (Slide 12 of PDF) */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-5 mb-6 space-y-3 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300 flex items-center gap-2">
          <Cpu size={16} className="text-indigo-400" /> Technologies Used (Slide 12 of Presentation)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {techStack.map((ts, idx) => (
            <div key={idx} className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-3">
              <span className="font-mono text-[10px] uppercase text-indigo-400 block mb-2 font-bold">
                {ts.category}
              </span>
              <ul className="space-y-1 text-[11px] text-zinc-300">
                {ts.tools.map((tool, ti) => (
                  <li key={ti} className="flex items-center gap-1.5 truncate">
                    <span className="h-1 w-1 rounded-full bg-indigo-400 shrink-0" />
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => onGoToSlide(1)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw size={14} /> Back to Cover (Slide 01)
        </button>

        <button
          type="button"
          onClick={() => onGoToSlide(4)}
          className="bg-white text-black font-semibold rounded-md px-6 py-2.5 text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-md cursor-pointer"
        >
          <span>Launch Verification Workstation (Slide 04)</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
