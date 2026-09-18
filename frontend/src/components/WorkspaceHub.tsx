import React, { useState } from "react";
import {
  Shield,
  Sparkles,
  ArrowRight,
  Zap,
  Terminal,
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ExternalLink,
  Layers,
  Cpu,
  Clock,
  Play,
  RotateCcw,
} from "lucide-react";
import type {
  AiModel,
  VerificationRequest,
  VerificationResponse,
  VerificationHistoryItem,
} from "../types";

interface WorkspaceHubProps {
  onStartVerification: (req: VerificationRequest) => void;
  onNavigateToConsole: (initialText?: string) => void;
  onSelectHistoryItem: (item: VerificationResponse | VerificationHistoryItem) => void;
  history: (VerificationResponse | VerificationHistoryItem)[];
  engineStatus: string;
}

export const SAMPLE_PRESETS = [
  {
    title: "Science & Physics Violation",
    badge: "Physics",
    model: "chatgpt" as AiModel,
    desc: "Mixed real physics vs standard model faster-than-light violation",
    text: "The specific heat capacity of water is 4.184 J/g C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances.",
  },
  {
    title: "History & Chronology Test",
    badge: "Chronology",
    model: "claude" as AiModel,
    desc: "Authentic historical and geographical facts with dates",
    text: "Paris is the capital and most populous city of France. The Eiffel Tower was constructed from 1887 to 1889 as the centerpiece of the 1889 World Fair.",
  },
  {
    title: "Academic Citation Audit",
    badge: "Citation / DOI",
    model: "gemini" as AiModel,
    desc: "Transformer architecture with real author and publication year",
    text: "Transformer neural networks replace recurrent loops with self-attention mechanisms. Vaswani, A. (2017). Attention Is All You Need. NeurIPS.",
  },
  {
    title: "Severe Hallucination Trap",
    badge: "High Risk",
    model: "other" as AiModel,
    desc: "Chronological and factual fabrications testing contradiction filters",
    text: "Python was invented in 2024 by Elon Musk. In 1985, NASA astronauts landed directly on the solid diamond core of Jupiter during Apollo 18.",
  },
];

export function WorkspaceHub({
  onStartVerification,
  onNavigateToConsole,
  onSelectHistoryItem,
  history,
  engineStatus,
}: WorkspaceHubProps) {
  const [quickInput, setQuickInput] = useState("");

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onStartVerification({
      text: quickInput.trim(),
      model: "chatgpt",
      verify_claims: true,
      verify_citations: true,
      verify_statistics: true,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full space-y-10 animate-fade-in">
      {/* Top Banner & Status Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-mono text-cyan-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 neon-pulse-cyan" />
            <span>Live Multi-Source Engine v2.4</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-300">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Status: {engineStatus.toUpperCase()}</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-zinc-400">
            <Database size={12} className="text-zinc-400" />
            <span>Consensus Quorum: 4 Engines</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToConsole()}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
        >
          <span>Open Full Analysis Console</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Hero Welcome Header */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Verify AI Output Against Ground Truth
        </h1>
        <p className="text-sm sm:text-base text-zinc-300 max-w-3xl leading-relaxed">
          HalluciCheck autonomous fact-checking pipeline decomposes generated text into verifiable assertions, cross-queries independent open knowledge repositories, audits citations against CrossRef DOIs, and calculates mathematical certainty tiers.
        </p>
      </div>

      {/* Quick Action Input Console */}
      <div className="glass-panel-cyan rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-3 text-xs font-mono text-cyan-300">
          <div className="flex items-center gap-2 font-semibold">
            <Terminal size={15} className="text-cyan-400" />
            <span>QUICK AUDIT PROMPT</span>
          </div>
          <span className="text-[11px] text-zinc-400">Instant multi-source verification</span>
        </div>

        <form onSubmit={handleQuickSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Paste raw AI output, scientific claims, or citations here to begin autonomous verification..."
              className="w-full rounded-xl border border-white/10 bg-[#060a12] p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans leading-relaxed resize-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span>Quick presets below or paste custom text</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToConsole(quickInput)}
                className="btn-glass text-xs px-3.5 py-2 font-mono"
              >
                Customize Toggles &gt;
              </button>

              <button
                type="submit"
                disabled={!quickInput.trim()}
                className="btn-cyan-gradient text-xs px-5 py-2 flex items-center gap-2 font-semibold shadow-md"
              >
                <span>Audit Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Preset Scan Shortcuts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-200 font-bold">
              Instant Diagnostic Scan Presets
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">One-click evaluation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group cursor-pointer"
              onClick={() => {
                onStartVerification({
                  text: preset.text,
                  model: preset.model,
                  verify_claims: true,
                  verify_citations: true,
                  verify_statistics: true,
                });
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                    {preset.badge}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    {preset.model}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                  {preset.title}
                </h3>
                <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2 mb-3">
                  {preset.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                <span>Run Audit</span>
                <Play size={11} fill="currentColor" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Capabilities Bento Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-200 font-bold flex items-center gap-2">
          <Layers size={16} className="text-emerald-400" />
          <span>Multi-Engine Ground Truth Architecture</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Search size={16} />
            </div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              01 · Multi-Source Search
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Synthesizes queries to extract corroborating evidence from Wikipedia REST API, DuckDuckGo Live Search, and scientific registries without prompt bias.
            </p>
            <div className="text-[10px] font-mono text-emerald-400 pt-1">
              Active consensus checking
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              02 · DOI &amp; Citation Audit
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Detects phantom papers, invented authors, and hallucinated DOIs by pinging CrossRef Scholarly Metadata API and official doi.org resolvers in real time.
            </p>
            <div className="text-[10px] font-mono text-emerald-400 pt-1">
              CrossRef REST integrated
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Cpu size={16} />
            </div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              03 · Certainty Calibration
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Scores assertions on a calibrated 0-100% curve based on semantic overlap, source authority, numerical fidelity, and contradiction penalties.
            </p>
            <div className="text-[10px] font-mono text-emerald-400 pt-1">
              Risk tier categorization
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Overview (if any) */}
      {history.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-200 font-bold flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" />
              <span>Recent Verification Sessions</span>
            </h2>
            <span className="text-xs font-mono text-zinc-400">{history.length} scans recorded</span>
          </div>

          <div className="glass-panel rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
            {history.slice(0, 4).map((item, idx) => {
              const conf = Math.round(item.overall_confidence);
              const snippet =
                "snippet" in item && item.snippet
                  ? item.snippet
                  : (item as VerificationResponse).claims?.[0]?.text || "Verification Report";

              return (
                <div
                  key={idx}
                  onClick={() => onSelectHistoryItem(item)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-cyan-400 font-bold">{item.verification_id}</span>
                      <span className="text-zinc-400 font-medium uppercase">{item.model}</span>
                      <span className="text-zinc-400">·</span>
                      <span className="text-zinc-400">{item.created_at || "Recent"}</span>
                    </div>
                    <p className="text-xs text-zinc-300 truncate max-w-2xl">{snippet}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                        conf >= 75
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : conf >= 45
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {conf}% Certainty
                    </span>
                    <button
                      type="button"
                      className="btn-glass text-xs px-3 py-1 text-cyan-300 hover:text-white"
                    >
                      Open Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
