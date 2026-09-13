import React, { useEffect, useState } from "react";
import { Shield, Sparkles, Terminal, Layers, ArrowDown } from "lucide-react";
import { getHealth, verifyContent } from "./api/client";
import { LandingHero } from "./components/LandingHero";
import { LandingProblem } from "./components/LandingProblem";
import { LandingArchitecture } from "./components/LandingArchitecture";
import { LandingWorkstation } from "./components/LandingWorkstation";
import { LandingEvidence } from "./components/LandingEvidence";
import { LandingHistory } from "./components/LandingHistory";
import { LandingTeam } from "./components/LandingTeam";
import { LandingFooter } from "./components/LandingFooter";
import type { VerificationRequest, VerificationResponse } from "./types";

export default function App() {
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState("Checking...");

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

    try {
      const data = await verifyContent(payload);
      setResult(data);
      localStorage.setItem("hallucicheck_last_result", JSON.stringify(data));
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(
        err.message ||
          "Failed to verify content. Check that the backend server is running and try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
      {/* Ambient Atmospheric Cosmic Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="ambient-glow-mesh top-[-100px] left-1/2 -translate-x-1/2" />
        <div className="absolute bottom-[-100px] -right-20 w-[550px] h-[450px] rounded-full bg-purple-950/20 blur-[130px]" />
      </div>

      {/* Sticky Top Header (Single-line at desktop, height 64px) */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#000000]/80 backdrop-blur-xl px-4 sm:px-6 h-16 flex items-center">
        <div className="mx-auto w-full max-w-7xl flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <a href="#hero" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="p-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-white shadow-sm">
              <Shield size={18} className="text-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                HalluciCheck
                <span className="text-[10px] font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                  v2.0
                </span>
              </span>
            </div>
          </a>

          {/* Nav Anchor Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
            <a href="#problem" className="hover:text-white transition-colors">
              Problem
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#workstation" className="hover:text-white transition-colors text-indigo-300">
              Workstation
            </a>
            <a href="#evidence" className="hover:text-white transition-colors">
              Evidence
            </a>
            <a href="#history" className="hover:text-white transition-colors">
              History
            </a>
            <a href="#team" className="hover:text-white transition-colors">
              Team
            </a>
          </nav>

          {/* Right Header: Status + Quick CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{engineStatus}</span>
            </div>

            <a
              href="#workstation"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Launch Verifier</span>
              <ArrowDown size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Flowing Section-Wise Landing Page */}
      <main className="w-full">
        <LandingHero engineStatus={engineStatus} />
        <LandingProblem />
        <LandingArchitecture />
        <LandingWorkstation
          onStartVerification={handleStartVerification}
          isProcessing={isProcessing}
          result={result}
          error={error}
        />
        <LandingEvidence result={result} />
        <LandingHistory onLoadReport={(rep) => setResult(rep)} />
        <LandingTeam />
      </main>

      {/* Modern Minimalist Footer */}
      <LandingFooter />
    </div>
  );
}
