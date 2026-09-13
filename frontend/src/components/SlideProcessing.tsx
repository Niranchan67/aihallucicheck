import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Search, Database, BookmarkCheck, BarChart3, AlertCircle, ArrowLeft } from "lucide-react";

interface SlideProcessingProps {
  isProcessing: boolean;
  error: string | null;
  onRetry: () => void;
}

export function SlideProcessing({ isProcessing, error, onRetry }: SlideProcessingProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Simulated stepper animation while awaiting backend response
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 1400);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const steps = [
    {
      id: 1,
      title: "Stage 1: Claim Extraction & NLP",
      desc: "Parsing sentences, detecting predicates, and separating verifiable assertions from subjective opinions.",
      icon: CheckCircle2,
    },
    {
      id: 2,
      title: "Stage 2: Independent Query Formulation",
      desc: "Decontextualizing each claim into unbiased, neutral search queries to avoid confirmation bias.",
      icon: Search,
    },
    {
      id: 3,
      title: "Stage 3: Multi-Source Web & Encyclopedia Retrieval",
      desc: "Querying Wikipedia REST API and DuckDuckGo Live Search for authoritative ground-truth passages.",
      icon: Database,
    },
    {
      id: 4,
      title: "Stage 4: Academic Citation & DOI Validation",
      desc: "Cross-referencing referenced literature against CrossRef's 150M+ scholarly records and DOI resolvers.",
      icon: BookmarkCheck,
    },
    {
      id: 5,
      title: "Stage 5: Multi-Source Evidence Synthesis & Scoring",
      desc: "Synthesizing evidence, calculating clinical confidence metrics, and generating semantic highlights.",
      icon: BarChart3,
    },
  ];

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-140px)] py-8 max-w-3xl mx-auto px-4">
      <div className="text-center mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-2 font-semibold">
          Slide 05 of 09 · Real-Time Pipeline Execution
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-3 tracking-tight">
          {error ? (
            <span className="text-rose-400 flex items-center gap-2">
              <AlertCircle size={26} /> Verification Interrupted
            </span>
          ) : (
            <>
              <Loader2 className="animate-spin text-indigo-400" size={26} />
              Executing Multi-Stage Verification Pipeline
            </>
          )}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
          {error
            ? "An error occurred while connecting to the verification engine or querying external sources."
            : "Cross-examining extracted claims against Wikipedia, DuckDuckGo live web search, and academic databases..."}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-4 shadow-xl">
          <p className="text-sm text-rose-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors shadow-md cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Workstation
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-6 sm:p-8 space-y-3.5 shadow-2xl">
          {steps.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-3.5 rounded-lg border transition-all ${
                  isCurrent
                    ? "bg-indigo-500/[0.08] border-indigo-500/35 shadow-[0_0_20px_rgba(99,102,241,0.12)]"
                    : isDone
                    ? "border-zinc-800/60 bg-zinc-950/40 opacity-85"
                    : "border-transparent bg-transparent opacity-30"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : isCurrent
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse"
                      : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} />
                  ) : isCurrent ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Icon size={18} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{step.title}</h3>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                      {isDone ? "Done" : isCurrent ? "Processing..." : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
