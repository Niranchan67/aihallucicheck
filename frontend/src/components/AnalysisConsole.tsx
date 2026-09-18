import React, { useState, useEffect } from "react";
import {
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  BookOpen,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Sliders,
  ShieldAlert,
} from "lucide-react";
import type { AiModel, VerificationRequest } from "../types";
import { SAMPLE_PRESETS } from "./WorkspaceHub";

interface AnalysisConsoleProps {
  onStartVerification: (req: VerificationRequest) => void;
  isProcessing: boolean;
  error: string | null;
  initialText?: string;
}

const AI_MODELS: { id: AiModel; name: string; tag: string }[] = [
  { id: "chatgpt", name: "OpenAI GPT-4o", tag: "Flagship" },
  { id: "claude", name: "Claude 3.5 Sonnet", tag: "Reasoning" },
  { id: "gemini", name: "Google Gemini 1.5", tag: "Multimodal" },
  { id: "llama", name: "Meta Llama 3.3 70B", tag: "Open Weights" },
  { id: "other", name: "Custom / Unknown", tag: "Generic" },
];

export function AnalysisConsole({
  onStartVerification,
  isProcessing,
  error,
  initialText = "",
}: AnalysisConsoleProps) {
  const [text, setText] = useState(
    initialText ||
      "The specific heat capacity of water is 4.184 J/g C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances."
  );
  const [model, setModel] = useState<AiModel>("chatgpt");
  const [aggressiveMode, setAggressiveMode] = useState(false);
  const [sourceDepth, setSourceDepth] = useState<"standard" | "deep">("standard");
  const [verifyCitations, setVerifyCitations] = useState(true);
  const [verifyStatistics, setVerifyStatistics] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isProcessing) return;

    onStartVerification({
      text: text.trim(),
      model,
      verify_claims: true,
      verify_citations: verifyCitations,
      verify_statistics: verifyStatistics,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12 max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-1">
            <Terminal size={14} />
            <span>Interactive Verification Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Analysis Input Console
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>Shortcuts:</span>
          <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
            ⌘ / Ctrl + Enter
          </kbd>
        </div>
      </div>

      {/* Main Console Box */}
      <div className="glass-panel-cyan rounded-2xl p-5 sm:p-7 space-y-6 shadow-2xl relative">
        {/* Model Selector Bar */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold flex items-center justify-between">
            <span>Select Origin Model:</span>
            <span className="text-[11px] text-zinc-400 font-normal">Calibrates domain bias filters</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {AI_MODELS.map((m) => {
              const isSelected = model === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-md shadow-cyan-500/10"
                      : "bg-[#0c1220]/70 border-white/10 hover:border-white/20 text-zinc-300 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{m.name}</div>
                  <div className="text-[10px] font-mono text-zinc-400">{m.tag}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Textarea Console */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Raw AI Output / Claim Assertions:</span>
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>·</span>
              <span>{charCount} chars</span>
              {text && (
                <button
                  type="button"
                  onClick={() => setText("")}
                  className="text-zinc-400 hover:text-rose-400 transition-colors ml-2 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative rounded-xl border border-white/10 bg-[#060a12] focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste raw AI response, research paper abstract, or statistical assertions to audit..."
              disabled={isProcessing}
              className="w-full bg-transparent p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans leading-relaxed resize-y min-h-[160px]"
            />

            {/* Bottom presets quick toolbar inside textarea */}
            <div className="border-t border-white/5 px-4 py-2.5 bg-[#080d1a]/80 rounded-b-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-zinc-400">
                <span className="text-zinc-400 shrink-0">Sample Presets:</span>
                {SAMPLE_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setText(p.text);
                      setModel(p.model);
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-cyan-500/15 hover:text-cyan-300 border border-white/5 transition-colors cursor-pointer shrink-0"
                  >
                    {p.badge}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const clip = await navigator.clipboard.readText();
                    if (clip) setText(clip);
                  } catch {}
                }}
                className="text-[11px] font-mono text-zinc-400 hover:text-cyan-400 cursor-pointer transition-colors"
              >
                Paste from Clipboard
              </button>
            </div>
          </div>
        </div>

        {/* Quick Toggles: Aggressive Mode & Source Depth */}
        <div className="rounded-xl border border-white/10 bg-[#080e1c]/90 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-200 uppercase tracking-wider">
            <Sliders size={14} className="text-cyan-400" />
            <span>Verification Parameters &amp; Engine Toggles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Toggle 1: Aggressive Mode */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={aggressiveMode}
                onChange={(e) => setAggressiveMode(e.target.checked)}
                className="mt-0.5 accent-cyan-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-200 block">Aggressive Mode</span>
                <span className="text-[11px] text-zinc-400 block leading-tight">
                  Enforces stricter 75% corroboration threshold &amp; clause isolation.
                </span>
              </div>
            </label>

            {/* Toggle 2: Source Depth */}
            <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02] space-y-1.5">
              <span className="font-semibold text-zinc-200 block">Source Depth</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSourceDepth("standard")}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-mono border transition-all ${
                    sourceDepth === "standard"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold"
                      : "bg-white/5 text-zinc-400 border-white/5 hover:text-white"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setSourceDepth("deep")}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-mono border transition-all ${
                    sourceDepth === "deep"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold"
                      : "bg-white/5 text-zinc-400 border-white/5 hover:text-white"
                  }`}
                >
                  Scholarly Deep
                </button>
              </div>
            </div>

            {/* Toggle 3: Citation & Numbers Check */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifyCitations}
                onChange={(e) => setVerifyCitations(e.target.checked)}
                className="mt-0.5 accent-cyan-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-200 block">CrossRef &amp; DOI Audit</span>
                <span className="text-[11px] text-zinc-400 block leading-tight">
                  Cross-checks bibliography references against doi.org registries.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Error Notification (if any) */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Controls & Processing Progress */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="text-xs font-mono text-zinc-400">
            {isProcessing ? (
              <span className="text-cyan-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Running autonomous consensus checks across 4 search indexes...</span>
              </span>
            ) : (
              <span>Ready for audit · Zero-shot multi-source evaluation</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setText("")}
              disabled={isProcessing || !text}
              className="btn-glass px-4 py-2.5 text-xs font-mono"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isProcessing || !text.trim()}
              className="btn-cyan-gradient px-6 py-2.5 text-xs flex items-center gap-2 font-bold shadow-lg shadow-cyan-500/25"
            >
              {isProcessing ? (
                <>
                  <RotateCcw size={14} className="animate-spin text-zinc-950" />
                  <span>Verifying Assertions...</span>
                </>
              ) : (
                <>
                  <span>Run Autonomous Audit</span>
                  <Play size={13} fill="currentColor" className="text-zinc-950" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Multi-Stage Processing Pipeline (Visible during verification) */}
        {isProcessing && (
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-[#070c17] space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
              <span className="font-semibold flex items-center gap-2">
                <Zap size={14} className="text-cyan-400 animate-bounce" />
                Executing Pipeline Stages
              </span>
              <span className="text-[11px] text-zinc-400">Sub-second orchestration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <span className="text-[10px] text-cyan-400 block">Stage 01</span>
                <span>Claim Extraction</span>
              </div>
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <span className="text-[10px] text-cyan-400 block">Stage 02</span>
                <span>Neutral Probe</span>
              </div>
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <span className="text-[10px] text-cyan-400 block">Stage 03</span>
                <span>Ground Truth Query</span>
              </div>
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <span className="text-[10px] text-cyan-400 block">Stage 04</span>
                <span>Certainty Scoring</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
