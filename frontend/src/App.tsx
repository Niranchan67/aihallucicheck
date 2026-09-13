import React, { useEffect, useState } from "react";
import { Shield, Sparkles, Terminal, BarChart2, Layers } from "lucide-react";
import { getHealth, verifyContent } from "./api/client";
import { SlideCover } from "./components/SlideCover";
import { SlideProblem } from "./components/SlideProblem";
import { SlideArchitecture } from "./components/SlideArchitecture";
import { SlideWorkstation } from "./components/SlideWorkstation";
import { SlideProcessing } from "./components/SlideProcessing";
import { SlideDashboard } from "./components/SlideDashboard";
import { SlideEvidence } from "./components/SlideEvidence";
import { SlideHistory } from "./components/SlideHistory";
import { SlideResearch } from "./components/SlideResearch";
import { SlideNavigation } from "./components/SlideNavigation";
import type { VerificationRequest, VerificationResponse } from "./types";

const SLIDE_TITLES = [
  { title: "Project Cover & Team", subtitle: "Major Project: AI Hallucination Verification System", icon: "shield" },
  { title: "Problem Statement", subtitle: "Why AI hallucination detection is vital", icon: "alert-triangle" },
  { title: "5-Stage Pipeline", subtitle: "Architecture & modular methodology", icon: "layers" },
  { title: "Live Workstation", subtitle: "Interactive AI text input & test presets", icon: "terminal" },
  { title: "Pipeline Execution", subtitle: "Live multi-source cross-checking progress", icon: "loader" },
  { title: "Results Dashboard", subtitle: "Confidence score gauge & text highlighter", icon: "bar-chart-2" },
  { title: "Evidence & Citations", subtitle: "Ground truth traceability & CrossRef audit", icon: "book-open" },
  { title: "Saved Reports (DB)", subtitle: "SQLite historical records & export", icon: "database" },
  { title: "Literature & Tech Stack", subtitle: "Survey comparison matrix & architecture", icon: "cpu" },
];

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState("Checking...");

  // Check health and load last result on startup
  useEffect(() => {
    getHealth()
      .then((res) => {
        setEngineStatus(res.status === "online" ? "Live Multi-Source" : "Standby");
      })
      .catch(() => {
        setEngineStatus("Offline");
      });

    try {
      const saved = localStorage.getItem("hallucicheck_last_result");
      if (saved) {
        setResult(JSON.parse(saved));
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  const handleStartVerification = async (payload: VerificationRequest) => {
    setIsProcessing(true);
    setError(null);
    setCurrentSlide(5); // Jump directly to the processing slide!

    try {
      const data = await verifyContent(payload);
      setResult(data);
      localStorage.setItem("hallucicheck_last_result", JSON.stringify(data));
      setIsProcessing(false);
      setCurrentSlide(6); // Automatically transition to results slide on completion!
    } catch (err: any) {
      setIsProcessing(false);
      setError(
        err.message ||
          "Failed to verify content. Check that the backend server is running and try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
      {/* Ambient Cosmic Background Aura (WriteMate AI Atmosphere) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="ambient-glow-mesh top-[-100px] left-1/2 -translate-x-1/2" />
        <div className="absolute bottom-[-100px] -right-20 w-[550px] h-[450px] rounded-full bg-purple-950/20 blur-[130px]" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-[#000000]/80 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Logo & Title */}
          <div
            onClick={() => setCurrentSlide(1)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white shadow-sm">
              <Shield size={18} className="text-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                HalluciCheck
                <span className="text-[10px] font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                  v2.0
                </span>
              </span>
              <span className="hidden sm:block text-[10px] font-mono text-zinc-400">
                AI Hallucination Verification System
              </span>
            </div>
          </div>

          {/* Quick Jump Slide Shortcuts */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setCurrentSlide(1)}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                currentSlide === 1
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              Cover
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide(3)}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                currentSlide === 3
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              Pipeline
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide(4)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium ${
                currentSlide === 4
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              <Terminal size={13} />
              Workstation
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide(6)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium ${
                currentSlide === 6
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              <BarChart2 size={13} />
              Results
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide(8)}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                currentSlide === 8
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              History
            </button>
          </nav>

          {/* Engine Status Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{engineStatus}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Slide Presentation Stage */}
      <main className="flex-1 w-full relative overflow-y-auto">
        {currentSlide === 1 && (
          <SlideCover
            onGoToSlide={setCurrentSlide}
            engineStatus={engineStatus}
          />
        )}
        {currentSlide === 2 && (
          <SlideProblem onNext={() => setCurrentSlide(3)} />
        )}
        {currentSlide === 3 && (
          <SlideArchitecture onNext={() => setCurrentSlide(4)} />
        )}
        {currentSlide === 4 && (
          <SlideWorkstation
            onStartVerification={handleStartVerification}
            isProcessing={isProcessing}
          />
        )}
        {currentSlide === 5 && (
          <SlideProcessing
            isProcessing={isProcessing}
            error={error}
            onRetry={() => setCurrentSlide(4)}
          />
        )}
        {currentSlide === 6 && (
          <SlideDashboard
            result={result}
            onGoToEvidence={() => setCurrentSlide(7)}
            onVerifyAgain={() => setCurrentSlide(4)}
          />
        )}
        {currentSlide === 7 && (
          <SlideEvidence
            result={result}
            onBackToDashboard={() => setCurrentSlide(6)}
            onNextToHistory={() => setCurrentSlide(8)}
          />
        )}
        {currentSlide === 8 && (
          <SlideHistory
            onLoadReport={(rep) => {
              setResult(rep);
              setCurrentSlide(6);
            }}
            onNextToResearch={() => setCurrentSlide(9)}
          />
        )}
        {currentSlide === 9 && (
          <SlideResearch onGoToSlide={setCurrentSlide} />
        )}
      </main>

      {/* Slide Navigation Bar with Next/Previous Buttons & Indicators */}
      <SlideNavigation
        currentSlide={currentSlide}
        totalSlides={9}
        slideTitles={SLIDE_TITLES}
        onSlideChange={setCurrentSlide}
      />
    </div>
  );
}