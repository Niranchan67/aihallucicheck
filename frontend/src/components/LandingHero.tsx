import React from "react";
import { Shield, Sparkles, ArrowDown, ExternalLink, Cpu, BookOpen, Search, CheckCircle2 } from "lucide-react";

interface LandingHeroProps {
  engineStatus: string;
}

export function LandingHero({ engineStatus }: LandingHeroProps) {
  return (
    <section id="hero" className="relative pt-12 pb-20 md:pt-16 md:pb-24 overflow-hidden border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Eyebrow & Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-mono tracking-wider uppercase text-zinc-300">
            <Sparkles size={12} className="text-indigo-400" />
            <span>MAJOR PROJECT 2026 : AI FACTUAL INTEGRITY</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYSTEM: {engineStatus.toUpperCase()}</span>
          </div>
        </div>

        {/* Hero Grid - Asymmetric Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Eliminate AI Hallucinations with Multi-Source Ground Truth
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 max-w-[55ch] leading-relaxed font-normal">
              Autonomous claim auditing and citation verification against Wikipedia, CrossRef, and live knowledge registries in real time.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#workstation"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all shadow-lg active:scale-[0.98]"
              >
                <span>Launch Verifier</span>
                <ArrowDown size={15} />
              </a>

              <a
                href="#architecture"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-zinc-900 text-zinc-200 border border-zinc-700 hover:border-zinc-500 font-medium text-sm transition-all active:scale-[0.98]"
              >
                <span>5-Stage Pipeline</span>
              </a>

              <a
                href="https://github.com/Niranchan67/aihallucicheck"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-zinc-400 hover:text-white font-mono text-xs transition-colors"
              >
                <span>GitHub Source</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Team Badges */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Project Leads:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900/60 text-xs font-mono text-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Niranchan NS (25CU0310156)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900/60 text-xs font-mono text-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Thanesh (25CU0310118)
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Diagnostic Preview Card */}
          <div className="lg:col-span-5">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 font-mono text-xs text-zinc-400">verification-summary.json</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  CONFIDENCE: 92%
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded bg-zinc-900/70 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-zinc-400 mb-1">
                    <span>FACTUAL ASSERTION</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={11} /> VERIFIED
                    </span>
                  </div>
                  <p className="text-zinc-200 font-sans text-xs">
                    "James Webb Space Telescope detected carbon dioxide in exoplanet WASP-39b atmosphere."
                  </p>
                  <div className="mt-2 text-[10px] text-indigo-400 flex items-center gap-1">
                    <BookOpen size={10} /> Corroborated via CrossRef DOI 10.1038/s41586-022-05269-w
                  </div>
                </div>

                <div className="p-3 rounded bg-zinc-900/70 border border-red-900/30">
                  <div className="flex items-center justify-between text-zinc-400 mb-1">
                    <span>SUSPICIOUS STATISTIC</span>
                    <span className="text-amber-400">DRIFT DETECTED</span>
                  </div>
                  <p className="text-zinc-300 font-sans text-xs">
                    "98.7% of all stars in the Milky Way are red dwarfs."
                  </p>
                  <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1">
                    <Search size={10} /> Actual verified estimate: ~70% to 75% (Wikipedia astronomical index)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credibility Logo Strip (Logos Only, No Category Labels) */}
        <div className="mt-16 pt-8 border-t border-zinc-800/80">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 text-center mb-6">
            INDEPENDENT GROUND TRUTH AUDIT SOURCES
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-zinc-400">
            <div className="flex items-center gap-2 font-mono text-sm tracking-tight text-zinc-300 hover:text-white transition-colors">
              <BookOpen size={18} className="text-indigo-400" />
              <span>Wikipedia REST API</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm tracking-tight text-zinc-300 hover:text-white transition-colors">
              <Cpu size={18} className="text-emerald-400" />
              <span>CrossRef Scholarly Registry</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm tracking-tight text-zinc-300 hover:text-white transition-colors">
              <Search size={18} className="text-cyan-400" />
              <span>DuckDuckGo Web Index</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm tracking-tight text-zinc-300 hover:text-white transition-colors">
              <Shield size={18} className="text-purple-400" />
              <span>International DOI Foundation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
