import React from "react";
import { Users, BookOpen, Cpu } from "lucide-react";

export function LandingTeam() {
  const team = [
    {
      name: "Niranchan NS",
      roll: "25CU0310156",
      role: "System Architecture, Claim Extraction and Multi-Source Cross-Check Lead",
      focus: "Engineered Stage 01 claim decomposition and Stage 03 multi-source retrieval adapters for Wikipedia REST API and DuckDuckGo.",
    },
    {
      name: "Thanesh",
      roll: "25CU0310118",
      role: "Citation Verification, Scoring Engine and Evaluation Lead",
      focus: "Engineered Stage 05 CrossRef DOI resolver integration, Stage 04 confidence calculation matrix, and benchmarking suite.",
    },
  ];

  const surveyComparison = [
    {
      framework: "SelfCheckGPT (2023)",
      method: "Self-consistency sampling across multiple LLM runs",
      limitation: "Zero external grounding; models can agree on a shared hallucination.",
    },
    {
      framework: "CoVe: Chain-of-Verification (2023)",
      method: "Internal self-questioning within single LLM loop",
      limitation: "High latency and token cost; verification questions can themselves hallucinate.",
    },
    {
      framework: "FactTool (2024)",
      method: "Tool-use search queries via proprietary search API",
      limitation: "Relies on closed commercial search quotas; limited academic DOI validation.",
    },
    {
      framework: "HalluciCheck (2026)",
      method: "Independent multi-source retrieval + CrossRef DOI catalog audit",
      limitation: "Ground truth anchored in open registries (Wikipedia REST, CrossRef, DuckDuckGo).",
      highlight: true,
    },
  ];

  const techStack = [
    { label: "Backend Core", value: "FastAPI, Python 3.11, Pydantic v2, Uvicorn ASGI" },
    { label: "External Registries", value: "Wikipedia REST API, CrossRef Works API, DuckDuckGo Search" },
    { label: "Data Persistence", value: "SQLite 3, SQLAlchemy 2.0 ORM, LocalStorage fallback" },
    { label: "Frontend & UI", value: "React 18, TypeScript, Tailwind CSS, Vite Production Pipeline" },
  ];

  return (
    <section id="team" className="py-20 md:py-24 border-b border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-mono tracking-wider uppercase text-zinc-300 mb-4">
            <Users size={12} className="text-indigo-400" />
            <span>PROJECT CREDENTIALS AND RESEARCH FOUNDATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Project Leadership and Literature Foundation
          </h2>
          <p className="mt-3 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Major Project 2026: Designed and developed as an open-access, zero-cost AI factual verification framework.
          </p>
        </div>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {team.map((member) => (
            <div
              key={member.roll}
              className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 font-mono">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                    ROLL: {member.roll}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <div className="text-xs font-mono text-indigo-400 mb-3">{member.role}</div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">{member.focus}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Computer Science and Engineering</span>
                <span className="text-emerald-400 font-medium">Major Project 2026</span>
              </div>
            </div>
          ))}
        </div>

        {/* Literature Survey Comparison Table */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-6 sm:p-8 mb-16 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <BookOpen size={18} className="text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Comparative Literature Survey</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Framework</th>
                  <th className="py-3 px-4">Verification Methodology</th>
                  <th className="py-3 px-4">Critical Limitation / Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {surveyComparison.map((item, i) => (
                  <tr
                    key={i}
                    className={item.highlight ? "bg-indigo-500/5 font-medium" : "hover:bg-zinc-900/30"}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {item.framework}
                      {item.highlight && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          OUR WORK
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">{item.method}</td>
                    <td className={`py-3.5 px-4 ${item.highlight ? "text-emerald-300 font-semibold" : "text-zinc-400"}`}>
                      {item.limitation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tech Stack Specs */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={16} className="text-cyan-400" />
            <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              System Engineering Architecture
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {techStack.map((tech, idx) => (
              <div key={idx} className="p-3 rounded bg-zinc-900/50 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase mb-1">{tech.label}</div>
                <div className="text-zinc-200 text-xs font-sans leading-snug">{tech.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
