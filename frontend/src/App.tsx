import React, { useEffect, useState } from "react";
import { getHealth, verifyContent, getVerification } from "./api/client";
import { HeaderBar } from "./components/HeaderBar";
import { HomeCoverView } from "./components/HomeCoverView";
import { LightConsole, PRESET_OPTIONS } from "./components/LightConsole";
import { LightResults } from "./components/LightResults";
import { LightHistory } from "./components/LightHistory";
import { BarChart3, ArrowRight, Play, Sparkles } from "lucide-react";
import type {
  AppTab,
  AiModel,
  VerificationRequest,
  VerificationResponse,
  VerificationHistoryItem,
} from "./types";

const LAST_RESULT_KEY = "hallucicheck_last_result";
const HISTORY_KEY = "hallucicheck_history";

export default function App() {
  // 1. Tab Navigation State with URL Hash Sync
  const getInitialTab = (): AppTab => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (
        hash === "workspace" ||
        hash === "dashboard" ||
        hash === "history" ||
        hash === "home"
      ) {
        return hash as AppTab;
      }
    }
    return "home";
  };

  const [activeTab, setActiveTab] = useState<AppTab>(getInitialTab);

  const handleNavigate = (tab: AppTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.location.hash = tab;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 2. Core Application State
  const [text, setText] = useState(
    "The specific heat capacity of water is 4.184 J/g C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances."
  );
  const [model, setModel] = useState<AiModel>("chatgpt");
  const [activeResult, setActiveResult] = useState<VerificationResponse | null>(null);
  const [history, setHistory] = useState<(VerificationResponse | VerificationHistoryItem)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState("Checking…");

  // 3. Initial LocalStorage Bridge, Hash Listener & System Health
  useEffect(() => {
    // Sync hash changes from browser history navigation
    const handleHashChange = () => {
      const currentTab = getInitialTab();
      setActiveTab(currentTab);
    };
    window.addEventListener("hashchange", handleHashChange);

    // Check Engine Health
    getHealth()
      .then((res) => {
        setEngineStatus(res.status === "online" ? "Live Multi-Source v2.0" : "Client Engine Active");
      })
      .catch(() => {
        setEngineStatus("Client Engine Active");
      });

    // Load last result from localStorage
    try {
      const savedResult = localStorage.getItem(LAST_RESULT_KEY);
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        if (parsed && typeof parsed === "object" && parsed.verification_id) {
          setActiveResult(parsed);
        }
      }
    } catch {
      // Graceful fallback
    }

    // Load history from localStorage
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsedHist = JSON.parse(savedHistory);
        if (Array.isArray(parsedHist)) {
          setHistory(parsedHist);
        }
      }
    } catch {
      // Graceful fallback
    }

    // Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setText("");
        handleNavigate("workspace");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 4. Start Verification Pipeline & Automatic Transition to Dashboard
  const handleStartVerification = async (payload: VerificationRequest) => {
    setIsProcessing(true);
    setError(null);

    try {
      const data = await verifyContent(payload);
      setActiveResult(data);
      setIsProcessing(false);

      // Persist to localStorage
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

      // Automatically switch view to Dashboard upon completion!
      handleNavigate("dashboard");
    } catch (err: any) {
      setIsProcessing(false);
      setError(
        err.message ||
          "Failed to verify content across consensus sources. Please check backend connection and retry."
      );
    }
  };

  // 5. Preset Selection
  const handleSelectPreset = (presetText: string, presetModel?: AiModel) => {
    setText(presetText);
    if (presetModel) {
      setModel(presetModel);
    } else {
      const matched = PRESET_OPTIONS.find((p) => p.text === presetText);
      if (matched) {
        setModel(matched.model);
      }
    }
  };

  // 6. Select Historical Audit
  const handleSelectAudit = async (item: VerificationResponse | VerificationHistoryItem) => {
    if ("claims" in item && Array.isArray(item.claims)) {
      setActiveResult(item as VerificationResponse);
      try {
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(item));
      } catch {}
      handleNavigate("dashboard");
    } else {
      try {
        const full = await getVerification(item.verification_id);
        setActiveResult(full);
        try {
          localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(full));
        } catch {}
        handleNavigate("dashboard");
      } catch {
        handleNavigate("dashboard");
      }
    }
  };

  // 7. Delete Single Historical Audit
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
      try {
        localStorage.removeItem(LAST_RESULT_KEY);
      } catch {}
    }
  };

  // 8. Clear All History
  const handleClearAllHistory = () => {
    setHistory([]);
    setActiveResult(null);
    try {
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(LAST_RESULT_KEY);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased relative font-sans light-dot-grid selection:bg-slate-900 selection:text-white">
      {/* Top Header Bar with Navigation Tabs */}
      <HeaderBar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        engineStatus={engineStatus}
        historyCount={history.length}
      />

      {/* Distinct View Stage (Strictly NO landing page scrolling) */}
      <main className="flex-1 w-full">
        {/* VIEW 1: HOME / COVER VIEW */}
        {activeTab === "home" && (
          <HomeCoverView
            onNavigate={handleNavigate}
            onSelectPreset={handleSelectPreset}
            onStartVerification={handleStartVerification}
            hasActiveResult={!!activeResult}
            historyCount={history.length}
          />
        )}

        {/* VIEW 2: VERIFICATION WORKSPACE (INPUT CONSOLE) */}
        {activeTab === "workspace" && (
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                  Analysis Input Console
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Submit AI output to decompose claims, query ground-truth consensus, and calculate factual certainty.
                </p>
              </div>

              {activeResult && (
                <button
                  type="button"
                  onClick={() => handleNavigate("dashboard")}
                  className="btn-pill-light text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
                >
                  <BarChart3 size={14} className="text-slate-600" />
                  <span>View Latest Report ({Math.round(activeResult.overall_confidence)}% Certainty)</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            <LightConsole
              onStartVerification={handleStartVerification}
              isProcessing={isProcessing}
              error={error}
              text={text}
              setText={setText}
              model={model}
              setModel={setModel}
            />
          </div>
        )}

        {/* VIEW 3: LIVE RESULTS DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 animate-fade-in">
            {activeResult ? (
              <LightResults
                result={activeResult}
                onVerifyAgain={() => handleNavigate("workspace")}
              />
            ) : (
              <div className="glass-card-light rounded-3xl p-10 sm:p-16 text-center space-y-6 max-w-xl mx-auto border border-slate-200 shadow-sm mt-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
                  <BarChart3 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900 font-sans">
                    No Active Verification Report
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    You have not audited any text in this session. Run an autonomous audit in the workspace
                    or load our physics benchmark to inspect factual confidence scores and highlighted claims.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate("workspace")}
                    className="btn-pill-dark px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-sm"
                  >
                    <span>Open Verification Workspace</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleStartVerification({
                        text: "The specific heat capacity of water is 4.184 J/g C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances.",
                        model: "chatgpt",
                        verify_claims: true,
                        verify_citations: true,
                        verify_statistics: true,
                      });
                    }}
                    className="btn-pill-light px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
                  >
                    <Sparkles size={14} className="text-slate-500" />
                    <span>Run Physics Benchmark</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: AUDIT HISTORY */}
        {activeTab === "history" && (
          <LightHistory
            history={history}
            onSelectAudit={handleSelectAudit}
            onDeleteAudit={handleDeleteAudit}
            onClearAllHistory={handleClearAllHistory}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 px-4 sm:px-8 mt-auto text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">HalluciCheck v2.0</span>
            <span>·</span>
            <span>AI Hallucination Verification</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-semibold">● Live Multi-Source Quorum</span>
            <span>Wikipedia REST · CrossRef DOI · DuckDuckGo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
