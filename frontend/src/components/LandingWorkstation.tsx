import React, { useState } from "react";
import {
  Terminal,
  Play,
  AlertCircle,
  CheckCircle2,
  Search,
  BookOpen,
  Gauge,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import type { AiModel, VerificationRequest, VerificationResponse } from "../types";

interface LandingWorkstationProps {
  onStartVerification: (req: VerificationRequest) => void;
  isProcessing: boolean;
  result: VerificationResponse | null;
  error: string | null;
}

const PRESETS = [
  {
    name: "Science and Physics",
    desc: "Mixed real physics vs standard model violation",
    model: "chatgpt" as AiModel,
    text: "The specific heat capacity of water is 4.184 J/g C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances.",
  },
  {
    name: "History and Geography",
    desc: "Authentic historical and geographical facts",
    model: "claude" as AiModel,
    text: "Paris is the capital and most populous city of France. The Eiffel Tower was constructed from 1887 to 1889 as the centerpiece of the 1889 World Fair.",
  },
  {
    name: "Academic Citation",
    desc: "Transformer architecture with real citation",
    model: "gemini" as AiModel,
    text: "Transformer neural networks replace recurrent loops with self-attention mechanisms. Vaswani, A. (2017). Attention Is All You Need. NeurIPS.",
  },
  {
    name: "Severe Hallucination",
    desc: "Chronological and factual fabrications",
    model: "other" as AiModel,
    text: "Python was invented in 2024 by Elon Musk. In 1985, NASA astronauts landed directly on the solid diamond core of Jupiter during Apollo 18.",
  },
];

export function LandingWorkstation({
  onStartVerification,
  isProcessing,
  result,
  error,
}: LandingWorkstationProps) {
  const [text, setText] = useState(PRESETS[0].text);
  const [model, setModel] = useState<AiModel>("chatgpt");
  const [verifyClaims, setVerifyClaims] = useState(true);
  const [verifyCitations, setVerifyCitations] = useState(true);
  const [verifyStatistics, setVerifyStatistics] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const maxChars = 5000;
  const trimmed = text.trim();
  const charCount = text.length;

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText(clip);
        setLocalError(null);
      }
    } catch {
      // Clipboard fallback
    }
  };

  const handleRun = () => {
    if (!trimmed) {
      setLocalError("Please enter text or select a preset before verifying.");
      return;
    }
    setLocalError(null);
    onStartVerification({
      text: trimmed,
      model,
      verify_claims: verifyClaims,
      verify_citations: verifyCitations,
      verify_statistics: verifyStatistics,
    });
  };

  const handleCopyReport = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="workstation" className="py-20 md:py-24 border-b border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Eyebrow and Title */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-mono tracking-wider uppercase text-zinc-300 mb-4">
            <Terminal size={12} className="text-indigo-400" />
            <span>INTERACTIVE VERIFICATION ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Live Fact-Checking Workstation
          </h2>
          <p className="mt-3 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Enter AI-generated text or pick an authentic test scenario to audit claims and cross-reference citations in real time.
          </p>
        </div>

        {/* Dual Column Layout: Input on Left, Live Results on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input Form and Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl backdrop-blur-xl">
              {/* Presets Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Quick-Load Benchmark Presets
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setText(p.text);
                        setModel(p.model);
                        setLocalError(null);
                      }}
                      className={`text-left p-2.5 rounded-md border text-xs transition-all ${
                        text === p.text
                          ? "border-indigo-500/60 bg-indigo-500/10 text-white"
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="claims-input" className="font-mono text-zinc-400 uppercase">
                    AI Output to Verify
                  </label>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Paste Clipboard
                    </button>
                    <span className={charCount > maxChars ? "text-red-400 font-bold" : "text-zinc-400"}>
                      {charCount} / {maxChars}
                    </span>
                  </div>
                </div>

                <textarea
                  id="claims-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste AI-generated text, articles, or research statements to verify..."
                  rows={6}
                  maxLength={maxChars}
                  className="w-full rounded-md border border-zinc-800 bg-black/60 p-3 text-sm text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed resize-y"
                />
              </div>

              {/* Options and Configuration */}
              <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifyClaims}
                      onChange={(e) => setVerifyClaims(e.target.checked)}
                      className="rounded border-zinc-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="font-medium">Verify Claims</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifyCitations}
                      onChange={(e) => setVerifyCitations(e.target.checked)}
                      className="rounded border-zinc-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="font-medium">Audit Citations</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifyStatistics}
                      onChange={(e) => setVerifyStatistics(e.target.checked)}
                      className="rounded border-zinc-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="font-medium">Check Numbers</span>
                  </label>
                </div>

                {/* Model Selector and Submit */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-zinc-400">Source Model:</span>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value as AiModel)}
                      className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="chatgpt">ChatGPT (OpenAI)</option>
                      <option value="claude">Claude (Anthropic)</option>
                      <option value="gemini">Gemini (Google)</option>
                      <option value="llama">Llama (Meta)</option>
                      <option value="other">Other LLM</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleRun}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Multi-Source...</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} className="fill-black" />
                        <span>Verify Content</span>
                      </>
                    )}
                  </button>
                </div>

                {(localError || error) && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{localError || error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Results or Readiness Stage */}
          <div className="lg:col-span-6">
            {isProcessing ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-8 shadow-xl text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 animate-pulse">
                  <Search size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Executing Multi-Source Audit</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Polling Wikipedia REST API, CrossRef scholarly metadata, and calculating factual precision scores...
                  </p>
                </div>

                <div className="space-y-2 max-w-xs mx-auto text-left font-mono text-xs">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-indigo-300">
                    <span>1. Claim Extraction</span>
                    <span className="text-[10px] text-emerald-400">DONE</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-indigo-300">
                    <span>2. Knowledge Retrieval</span>
                    <span className="text-[10px] text-indigo-400 animate-pulse">QUERYING</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-400">
                    <span>3. Citation Verification</span>
                    <span className="text-[10px] text-zinc-400">QUEUED</span>
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl space-y-6">
                {/* Result Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-4 gap-3">
                  <div>
                    <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                      VERIFICATION ID: {result.verification_id}
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xl font-black text-white">
                        {Math.round(result.overall_confidence * 100)}%
                      </span>
                      <span className="text-xs font-mono text-zinc-300">Overall Factual Confidence</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-200 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copied ? "Copied" : "Copy JSON"}</span>
                    </button>
                    <a
                      href="#evidence"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-xs font-mono text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                    >
                      <span>Drilldown</span>
                    </a>
                  </div>
                </div>

                {/* Status Breakdown Bar */}
                <div className="grid grid-cols-3 gap-3 text-center font-mono">
                  <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-lg font-bold text-emerald-400">{result.verified_count}</div>
                    <div className="text-[10px] text-zinc-400 uppercase">Verified</div>
                  </div>
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20">
                    <div className="text-lg font-bold text-amber-400">{result.suspicious_count}</div>
                    <div className="text-[10px] text-zinc-400 uppercase">Suspicious</div>
                  </div>
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                    <div className="text-lg font-bold text-red-400">{result.hallucinated_count}</div>
                    <div className="text-[10px] text-zinc-400 uppercase">Hallucinated</div>
                  </div>
                </div>

                {/* Claims List Preview */}
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {result.claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-3.5 rounded border border-zinc-800/80 bg-zinc-900/60 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-400 uppercase text-[10px]">{claim.type} CLAIM</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            claim.status === "verified"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : claim.status === "suspicious"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {claim.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-200 leading-relaxed font-sans">"{claim.text}"</p>
                      {claim.evidence && (
                        <div className="text-[11px] text-zinc-400 font-sans border-l-2 border-indigo-500/40 pl-2 mt-1">
                          {claim.evidence}
                        </div>
                      )}
                      {claim.source && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1">
                          <span>Source: {claim.source}</span>
                          {claim.source_url && (
                            <a
                              href={claim.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Reference</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Idle / Standby Card */
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-8 shadow-xl space-y-6">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                  <div className="p-2.5 rounded-md border border-zinc-800 bg-zinc-900 text-indigo-400">
                    <Gauge size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Diagnostic Output Canvas</h3>
                    <p className="text-xs text-zinc-400">Waiting for verification trigger</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Click <strong>Verify Content</strong> on the left or select any preset to execute an end-to-end multi-source audit.
                  The engine will extract individual assertions, cross-reference Wikipedia and DuckDuckGo, and validate academic citations with CrossRef.
                </p>

                <div className="p-4 rounded-md border border-zinc-800/80 bg-zinc-900/40 space-y-3 font-mono text-xs text-zinc-300">
                  <div className="text-[10px] uppercase text-zinc-400 tracking-wider">Ready Integrations</div>
                  <div className="flex items-center justify-between">
                    <span>Wikipedia REST Knowledge Base</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>CrossRef Scholarly Registry</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>DuckDuckGo Web Search Index</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>DOI Foundation Resolution</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
