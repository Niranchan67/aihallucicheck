import React from "react";
import { ShieldCheck, ArrowRight, Sparkles, Terminal, Users, Layers, CheckCircle2 } from "lucide-react";

interface SlideCoverProps {
  onGoToSlide: (slide: number) => void;
  engineStatus: string;
}

export function SlideCover({ onGoToSlide, engineStatus }: SlideCoverProps) {
  const teamMembers = [
    { name: "Niranchan NS", reg: "25CU0310156", module: "Claim Extraction & Cross-Check", initials: "NN" },
    { name: "Hemesh BL", reg: "25CU0310148", module: "Independent Verification", initials: "HB" },
    { name: "Kiran B Nambiyar", reg: "25CU0310114", module: "Citation Validation", initials: "KB" },
    { name: "Thanesh", reg: "25CU0310118", module: "Dashboard, Scoring & Testing", initials: "TH" },
  ];

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-140px)] py-8 max-w-5xl mx-auto px-4 relative">
      {/* Top Banner Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-mono tracking-widest uppercase text-zinc-300">
          <Sparkles size={13} className="text-indigo-400 animate-pulse" />
          <span>MAJOR PROJECT · 2026</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>ENGINE: {engineStatus.toUpperCase()}</span>
        </div>
      </div>

      {/* Main Title Hero Card with Ambient Cosmic Glow */}
      <div className="relative rounded-2xl border border-zinc-800/80 bg-[#0c0d12]/90 p-8 sm:p-12 overflow-hidden mb-8 shadow-2xl backdrop-blur-xl">
        {/* WriteMate Atmospheric Glow in Hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-600/20 via-indigo-600/25 to-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-900/80 text-white shadow-lg">
              <ShieldCheck size={32} className="text-indigo-400" />
            </div>
            <div>
              <span className="font-mono text-xs text-indigo-400 uppercase tracking-widest font-semibold">
                Automated Fact-Checking &amp; Citation Audit
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-1">
                AI Hallucination Verification System
              </h1>
            </div>
          </div>

          <p className="mt-4 text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
            A multi-stage automated pipeline to detect, verify, and flag fabricated content in AI-generated text.
            Cross-checks assertions against external ground truth (Wikipedia &amp; DuckDuckGo Live Search)
            and validates academic citations (CrossRef &amp; DOI) to generate clinical confidence scores.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onGoToSlide(4)}
              className="bg-white text-black font-semibold rounded-md px-6 py-3 text-sm flex items-center gap-2.5 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-md"
            >
              <Terminal size={17} />
              <span>Launch Live Verification Workstation</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={() => onGoToSlide(3)}
              className="border border-zinc-700 hover:border-zinc-500 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-200 font-medium rounded-md px-6 py-3 text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Layers size={17} className="text-indigo-400" />
              <span>View 5-Stage Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <Users size={16} className="text-indigo-400" /> Project Team &amp; Module Allocation
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">Slide 01 of 09</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {teamMembers.map((member) => (
            <div
              key={member.reg}
              className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-4 transition-all hover:border-zinc-700 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-indigo-300">
                  {member.initials}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{member.name}</h3>
                  <span className="font-mono text-[11px] text-zinc-400">{member.reg}</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
                <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 block mb-0.5">
                  Assigned Module
                </span>
                <p className="text-xs text-zinc-300 font-medium">{member.module}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
