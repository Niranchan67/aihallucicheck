import React, { useEffect, useState, useRef } from "react";
import { getHealth, verifyContent, getVerification } from "./api/client";
import { HeaderBar } from "./components/HeaderBar";
import { LightConsole, PRESET_OPTIONS } from "./components/LightConsole";
import { LightResults } from "./components/LightResults";
import { HistoryDrawer } from "./components/HistoryDrawer";
import type {
  AiModel,
  VerificationRequest,
  VerificationResponse,
  VerificationHistoryItem,
} from "./types";

const LAST_RESULT_KEY = "hallucicheck_last_result";
const HISTORY_KEY = "hallucicheck_history";

export default function App() {
  const [text, setText] = useState(
    "The specific heat capacity of water is 4.184 J/g C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances."
  );
  const [model, setModel] = useState<AiModel>("chatgpt");
  const [activeResult, setActiveResult] = useState<VerificationResponse | null>(null);
  const [history, setHistory] = useState<(VerificationResponse | VerificationHistoryItem)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState("Checking…");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // 1. Initial LocalStorage Bridge & System Health
  useEffect(() => {
    // Check Engine Health
    getHealth()
      .then((res) => {
        setEngineStatus(res.status === "online" ? "Live Multi-Source v2.0" : "Client Engine Active");
      })
      .catch(() => {
        setEngineStatus("Client Engine Active");
      });

    // Gracefully load last result from localStorage
    try {
      const savedResult = localStorage.getItem(LAST_RESULT_KEY);
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        if (parsed && typeof parsed === "object" && parsed.verification_id) {
          setActiveResult(parsed);
        }
      }
    } catch {
      // Ignore corrupted localStorage data
    }

    // Gracefully load history from localStorage
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsedHist = JSON.parse(savedHistory);
        if (Array.isArray(parsedHist)) {
          setHistory(parsedHist);
        }
      }
    } catch {
      // Ignore corrupted localStorage data
    }

    // Keyboard Shortcuts: Cmd+N / Ctrl+N to clear/start new, Esc to dismiss modals
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleStartNew();
      }
      if (e.key === "Escape") {
        setIsHistoryOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. Start Verification Pipeline
  const handleStartVerification = async (payload: VerificationRequest) => {
    setIsProcessing(true);
    setError(null);

    try {
      const data = await verifyContent(payload);
      setActiveResult(data);
      setIsProcessing(false);

      // Persist to localStorage data bridge
      try {
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(data));
      } catch {}

      // Update history
      setHistory((prev) => {
        const updated = [data, ...prev.filter((p) => p.verification_id !== data.verification_id)].slice(
          0,
          50
        );
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(
        err.message ||
          "Failed to verify content across consensus sources. Please check backend connection and retry."
      );
    }
  };

  // 3. Preset Quick Select
  const handleSelectPreset = (presetText: string) => {
    setText(presetText);
    const matched = PRESET_OPTIONS.find((p) => p.text === presetText);
    if (matched) {
      setModel(matched.model);
    }
  };

  // 4. Select Historical Audit
  const handleSelectAudit = async (item: VerificationResponse | VerificationHistoryItem) => {
    if ("claims" in item && Array.isArray(item.claims)) {
      setActiveResult(item as VerificationResponse);
      try {
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(item));
      } catch {}
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      try {
        const full = await getVerification(item.verification_id);
        setActiveResult(full);
        try {
          localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(full));
        } catch {}
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch {
        // Fallback
      }
    }
  };

  // 5. Delete and Clear History
  const handleDeleteAudit = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((p) => p.verification_id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (activeResult?.verification_id === id) {
      setActiveResult(null);
      localStorage.removeItem(LAST_RESULT_KEY);
    }
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    setActiveResult(null);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(LAST_RESULT_KEY);
  };

  const handleStartNew = () => {
    setText("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased relative font-sans light-dot-grid selection:bg-slate-900 selection:text-white">
      {/* Top Header Bar */}
      <HeaderBar
        engineStatus={engineStatus}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Single-View LLM Workspace Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
        {/* Workspace Intro Hero */}
        <div className="text-center sm:text-left space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            AI Hallucination Verification Workspace
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            Deconstruct model assertions into atomic claims, cross-query Wikipedia and DuckDuckGo for ground-truth consensus, audit DOIs via CrossRef, and calculate calibrated certainty tiers in real time.
          </p>
        </div>

        {/* 1. Analysis Input Console */}
        <LightConsole
          onStartVerification={handleStartVerification}
          isProcessing={isProcessing}
          error={error}
          text={text}
          setText={setText}
          model={model}
          setModel={setModel}
        />

        {/* 2. Dynamic Results Dashboard (Anchored below input) */}
        <div ref={resultsRef} className="pt-2">
          {activeResult ? (
            <LightResults
              result={activeResult}
              onVerifyAgain={handleStartNew}
            />
          ) : (
            <div className="glass-card-light rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <span className="font-mono text-sm font-bold">01</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Ready to Verify Assertions
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Paste any model response above and click <strong>“Run Autonomous Audit”</strong> to generate the clinical factual certainty report, highlighted sentence inspector, and DOI validation logs.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-4 sm:px-8 mt-12 text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">HalluciCheck v2.0</span>
            <span>·</span>
            <span>AI Hallucination Verification</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-semibold">● Ground Truth Consensus Active</span>
            <span>Wikipedia REST · CrossRef DOI · DuckDuckGo</span>
          </div>
        </div>
      </footer>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectAudit={handleSelectAudit}
        onDeleteAudit={handleDeleteAudit}
        onClearAllHistory={handleClearAllHistory}
      />
    </div>
  );
}
