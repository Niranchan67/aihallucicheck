import React, { useState } from "react";
import { Terminal, Clipboard, Sparkles, Sliders, Play, RotateCcw, AlertCircle } from "lucide-react";
import type { AiModel, VerificationRequest } from "../types";

interface SlideWorkstationProps {
  onStartVerification: (req: VerificationRequest) => void;
  isProcessing: boolean;
}

const PRESETS = [
  {
    name: "🔬 Science & Physics",
    desc: "Mixed real physics vs standard model violation",
    model: "chatgpt" as AiModel,
    text: "The specific heat capacity of water is 4.184 J/g°C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances.",
  },
  {
    name: "🏛️ History & Geography",
    desc: "Authentic historical and geographical facts",
    model: "claude" as AiModel,
    text: "Paris is the capital and most populous city of France. The Eiffel Tower was constructed from 1887 to 1889 as the centerpiece of the 1889 World's Fair.",
  },
  {
    name: "📄 Academic Citation",
    desc: "Transformer architecture with real citation",
    model: "gemini" as AiModel,
    text: "Transformer neural networks replace recurrent loops with self-attention mechanisms. Vaswani, A. (2017). Attention Is All You Need. NeurIPS.",
  },
  {
    name: "🚨 Blatant Hallucination",
    desc: "Severe chronological & factual fabrications",
    model: "other" as AiModel,
    text: "Python was invented in 2024 by Elon Musk. In 1985, NASA astronauts landed directly on the solid diamond core of Jupiter during Apollo 18.",
  },
];

export function SlideWorkstation({ onStartVerification, isProcessing }: SlideWorkstationProps) {
  const [text, setText] = useState(PRESETS[0].text);
  const [model, setModel] = useState<AiModel>("chatgpt");
  const [verifyClaims, setVerifyClaims] = useState(true);
  const [verifyCitations, setVerifyCitations] = useState(true);
  const [verifyStatistics, setVerifyStatistics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxChars = 5000;
  const trimmed = text.trim();
  const charCount = text.length;

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText(clip);
        setError(null);
      }
    } catch {
      // Fallback
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setText(preset.text);
    setModel(preset.model);
    setError(null);
  };

  const handleSubmit = () => {
    if (!trimmed) {
      setError("Please input or select AI-generated text to verify.");
      return;
    }
    if (trimmed.length > maxChars) {
      setError(`Input exceeds ${maxChars} characters limit.`);
      return;
    }
    setError(null);
    onStartVerification({
      text: trimmed,
      model,
      verify_claims: verifyClaims,
      verify_citations: verifyCitations,
      verify_statistics: verifyStatistics,
    });
  };

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-140px)] py-8 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-1 font-semibold">
            Slide 04 of 09 · Interactive Workstation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <Terminal className="text-indigo-400" size={26} />
            Live Verification Workstation
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePaste}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
          >
            <Clipboard size={13} /> Paste from Clipboard
          </button>
          <button
            type="button"
            onClick={() => setText("")}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="mb-4">
        <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2 font-medium">
          Quick-Load Test Presets:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="rounded-lg border border-zinc-800/80 bg-[#0c0d12]/80 hover:border-zinc-700 hover:bg-zinc-900/50 p-2.5 text-left transition-all text-xs cursor-pointer shadow-sm"
            >
              <span className="font-semibold text-zinc-200 block truncate">{p.name}</span>
              <span className="text-[10px] text-zinc-400 block truncate mt-0.5">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea Panel */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-4 sm:p-5 relative mb-4 shadow-xl">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste AI-generated text from ChatGPT, Claude, Gemini, or any LLM here to cross-check..."
          rows={6}
          className="w-full bg-[#050507] border border-zinc-800 rounded-lg p-4 text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-all font-sans resize-y"
          disabled={isProcessing}
        />

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-400" />
            Enter any claim — our pipeline cross-checks Wikipedia &amp; DuckDuckGo live.
          </span>
          <span className={charCount > maxChars ? "text-rose-400 font-bold" : "text-zinc-500"}>
            {charCount} / {maxChars} chars
          </span>
        </div>
      </div>

      {/* Verification Parameters & Options */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-4 sm:p-5 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1 font-semibold">
            <Sliders size={14} /> Verification Parameters
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifyClaims}
                onChange={(e) => setVerifyClaims(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0"
              />
              <span className="text-zinc-300">Extract &amp; Verify Factual Claims</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifyCitations}
                onChange={(e) => setVerifyCitations(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0"
              />
              <span className="text-zinc-300">Validate Scholarly Citations &amp; DOIs</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifyStatistics}
                onChange={(e) => setVerifyStatistics(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0"
              />
              <span className="text-zinc-300">Numeric/Statistical Rigor</span>
            </label>
          </div>
        </div>

        {/* Source Model */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">Source AI:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as AiModel)}
            className="rounded-md border border-zinc-800 bg-[#09090b] px-3 py-2 text-xs font-medium text-zinc-200 focus:outline-none focus:border-zinc-600 w-full md:w-auto"
          >
            <option value="chatgpt">ChatGPT (OpenAI)</option>
            <option value="claude">Claude (Anthropic)</option>
            <option value="gemini">Gemini (Google)</option>
            <option value="llama">Llama 3 (Meta)</option>
            <option value="other">Custom / Other LLM</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!trimmed || isProcessing}
          className="bg-white text-black font-semibold rounded-md px-6 py-3 text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-md disabled:opacity-40 disabled:pointer-events-none w-full sm:w-auto cursor-pointer"
        >
          <Play size={16} fill="currentColor" />
          <span>{isProcessing ? "Executing Pipeline…" : "Launch Verification Pipeline ▶"}</span>
        </button>
      </div>
    </div>
  );
}
