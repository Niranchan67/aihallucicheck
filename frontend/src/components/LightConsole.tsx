import React, { useState } from "react";
import {
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Zap,
  Layers,
  Search,
  BookOpen,
} from "lucide-react";
import type { AiModel, VerificationRequest } from "../types";

interface LightConsoleProps {
  onStartVerification: (req: VerificationRequest) => void;
  isProcessing: boolean;
  error: string | null;
  text: string;
  setText: (val: string) => void;
  model: AiModel;
  setModel: (m: AiModel) => void;
  onSelectPreset?: (text: string, model: AiModel) => void;
}


const MODEL_LIST: { id: AiModel; name: string }[] = [
  { id: "chatgpt", name: "OpenAI GPT-4o" },
  { id: "claude", name: "Claude 3.5 Sonnet" },
  { id: "gemini", name: "Google Gemini 1.5" },
  { id: "llama", name: "Meta Llama 3.3 70B" },
  { id: "other", name: "Custom Model" },
];

export function LightConsole({
  onStartVerification,
  isProcessing,
  error,
  text,
  setText,
  model,
  setModel,
  onSelectPreset,
}: LightConsoleProps) {
  const [aggressiveMode, setAggressiveMode] = useState(false);
  const [sourceDepth, setSourceDepth] = useState<"standard" | "deep">("standard");
  const [verifyCitations, setVerifyCitations] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isProcessing) return;

    onStartVerification({
      text: text.trim(),
      model,
      verify_claims: true,
      verify_citations: verifyCitations,
      verify_statistics: true,
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
    <section className="w-full">
      <div className="glass-card-light rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
        {/* Model Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Target Origin Model:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {MODEL_LIST.map((m) => {
              const isSelected = model === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Textarea with Floating Indicators */}
        <div className="space-y-2">
          <div className="relative rounded-2xl border border-slate-200/90 bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-900/5 transition-all shadow-2xs">
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste any statement, raw AI output, scientific assertion, or research text to analyze thoroughly against legit ground-truth sources (OpenAlex, PubMed, ArXiv, DuckDuckGo, Wikipedia)…"
              disabled={isProcessing}
              className="w-full bg-transparent p-4 sm:p-5 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none font-sans leading-relaxed resize-y min-h-[140px]"
            />

            {/* Bottom Inner Toolbar */}
            <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/70 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Ready for thorough multi-source analysis</span>
              </div>

              {/* Counters & Actions */}
              <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px]">
                <span>{wordCount} words</span>
                <span>·</span>
                <span>{charCount} chars</span>
                {text && (
                  <button
                    type="button"
                    onClick={() => setText("")}
                    className="text-slate-500 hover:text-rose-600 transition-colors font-sans cursor-pointer font-medium"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clip = await navigator.clipboard.readText();
                      if (clip) setText(clip);
                    } catch {}
                  }}
                  className="text-slate-700 hover:text-slate-950 font-semibold bg-white border border-slate-200 px-2.5 py-0.5 rounded-md hover:bg-slate-100 transition-colors font-sans cursor-pointer shadow-2xs"
                >
                  Paste
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar with Toggles & Pill Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <Sliders size={13} className="text-slate-500" />
              <span>{showOptions ? "Hide Audit Options" : "Audit Parameters"}</span>
            </button>

            <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">⌘/Ctrl+Enter</kbd> to audit
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isProcessing || !text.trim()}
              className="btn-pill-dark text-xs sm:text-sm px-6 py-2.5 shadow-sm"
            >
              {isProcessing ? (
                <>
                  <RotateCcw size={15} className="animate-spin text-white" />
                  <span>Verifying Assertions…</span>
                </>
              ) : (
                <>
                  <span>Run Autonomous Audit</span>
                  <Play size={14} fill="currentColor" className="text-white" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Parameter Toggles */}
        {showOptions && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3 text-xs animate-fade-in">
            <div className="font-semibold text-slate-800 uppercase tracking-wider font-mono text-[11px]">
              Engine Toggles
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aggressiveMode}
                  onChange={(e) => setAggressiveMode(e.target.checked)}
                  className="mt-0.5 accent-slate-900 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Aggressive Mode</span>
                  <span className="text-[11px] text-slate-500 block leading-snug">
                    Enforces strict 75% corroboration threshold.
                  </span>
                </div>
              </label>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1">
                <span className="font-semibold text-slate-900 block">Source Depth</span>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setSourceDepth("standard")}
                    className={`flex-1 py-1 rounded border ${
                      sourceDepth === "standard"
                        ? "bg-slate-900 text-white font-semibold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceDepth("deep")}
                    className={`flex-1 py-1 rounded border ${
                      sourceDepth === "deep"
                        ? "bg-slate-900 text-white font-semibold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Scholarly
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verifyCitations}
                  onChange={(e) => setVerifyCitations(e.target.checked)}
                  className="mt-0.5 accent-slate-900 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">CrossRef DOI Audit</span>
                  <span className="text-[11px] text-slate-500 block leading-snug">
                    Resolves academic citations against doi.org.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Active Verification Progress Pipeline */}
        {isProcessing && (
          <div
            aria-live="polite"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 animate-fade-in"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-2">
                <Zap size={14} className="text-indigo-600" />
                <span>Verification Pipeline Active…</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">Querying 4 Consensus Sources</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                <span className="text-[10px] text-indigo-600 block font-bold">STAGE 01</span>
                <span>Claim Extraction</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                <span className="text-[10px] text-indigo-600 block font-bold">STAGE 02</span>
                <span>Neutral Probe</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                <span className="text-[10px] text-indigo-600 block font-bold">STAGE 03</span>
                <span>Ground Truth</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                <span className="text-[10px] text-indigo-600 block font-bold">STAGE 04</span>
                <span>Certainty Ring</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
