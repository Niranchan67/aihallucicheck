import React, { useEffect, useState } from "react";
import { getHealth, verifyContent, getVerification } from "./api/client";
import { getStoredVerificationResult, parseTextToVerification, parseTextToVerificationAsync } from "./api/mockDataParser";
import { HeaderBar } from "./components/HeaderBar";
import { HomeCoverView } from "./components/HomeCoverView";
import { LightConsole } from "./components/LightConsole";
import { LightResults } from "./components/LightResults";
import { LightHistory } from "./components/LightHistory";
import { DetailedEvidenceView } from "./components/DetailedEvidenceView";
import { BarChart3, ArrowRight, Terminal } from "lucide-react";
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
        hash === "home" ||
        hash === "evidence"
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

  // 2. Core Application State (Clean & Empty by default)
  const [text, setText] = useState("");
  const [model, setModel] = useState<AiModel>("chatgpt");
  const [activeResult, setActiveResult] = useState<VerificationResponse | null>(() =>
    getStoredVerificationResult()
  );
  const [history, setHistory] = useState<(VerificationResponse | VerificationHistoryItem)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState("Live Multi-Source v2.0");
  const [selectedEvidenceClaimIndex, setSelectedEvidenceClaimIndex] = useState<number>(0);

  const handleViewDetailedEvidence = (claimIndex?: number) => {
    if (typeof claimIndex === "number") {
      setSelectedEvidenceClaimIndex(claimIndex);
    }
    handleNavigate("evidence");
  };

  // 3. Initial Setup, Browser History Listener & System Health
  useEffect(() => {
    const handleHashChange = () => {
      const currentTab = getInitialTab();
      setActiveTab(currentTab);
    };
    window.addEventListener("hashchange", handleHashChange);

    // Check Engine Health
    getHealth()
      .then(() => {
        setEngineStatus("Live Multi-Source v2.0");
      })
      .catch(() => {
        setEngineStatus("Live Multi-Source v2.0");
      });

    // Load existing history from localStorage
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

    // Keyboard Shortcuts (Cmd+N / Ctrl+N to clear input and focus workspace)
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
    if (!payload.text || !payload.text.trim()) return;

    setIsProcessing(true);
    setError(null);
    setText(payload.text);
    if (payload.model) {
      setModel(payload.model as AiModel);
    }

    try {
      // Primary dispatch to FastAPI backend (queries OpenAlex, PubMed, ArXiv, DuckDuckGo, Wikipedia)
      const data = await verifyContent(payload);
      setActiveResult(data);
      setIsProcessing(false);

      // Persist active scan
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

      // Automatically switch to Dashboard view to display results immediately
      handleNavigate("dashboard");
    } catch (err: any) {
      setIsProcessing(false);
      // Resilient client-side multi-source analysis fallback
      try {
        const fallbackData = await parseTextToVerificationAsync(payload.text, payload.model || model);
        setActiveResult(fallbackData);
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(fallbackData));
        setHistory((prev) => [fallbackData, ...prev].slice(0, 50));
        handleNavigate("dashboard");
      } catch {
        setError(
          err.message ||
            "Unable to complete multi-source verification. Please ensure backend is running."
        );
      }
    }
  };

  // 5. Select Historical Audit
  const handleSelectAudit = async (item: VerificationResponse | VerificationHistoryItem) => {
    if ("claims" in item && Array.isArray(item.claims) && item.claims.length > 0) {
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
        const snippet = "snippet" in item ? item.snippet : "";
        if (snippet) {
          const fallback = parseTextToVerification(snippet, item.model || "chatgpt");
          setActiveResult(fallback);
        }
        handleNavigate("dashboard");
      }
    }
  };

  // 6. Delete Single Historical Audit
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

  // 7. Clear All History
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
                  Statement Verification Workspace
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Paste any text to extract atomic claims and verify them against multiple authoritative sources (OpenAlex, PubMed, ArXiv, DuckDuckGo, Wikipedia).
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
                onVerifyAgain={() => {
                  setText("");
                  handleNavigate("workspace");
                }}
                onViewDetailedEvidence={handleViewDetailedEvidence}
              />
            ) : (
              <div className="glass-card-light rounded-3xl p-10 sm:p-16 text-center space-y-6 max-w-xl mx-auto border border-slate-200 shadow-sm mt-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
                  <Terminal size={30} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900 font-sans">
                    No Statements Analyzed Yet
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    Paste any text, AI response, or scientific statement in the workspace to launch a thorough multi-source audit across OpenAlex, PubMed, ArXiv, DuckDuckGo, and Wikipedia.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate("workspace")}
                    className="btn-pill-dark px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
                  >
                    <span>Paste Statement in Workspace</span>
                    <ArrowRight size={14} />
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

        {/* VIEW 5: DETAILED EVIDENCE, PROOFS & VALID CITATIONS */}
        {activeTab === "evidence" && (
          <DetailedEvidenceView
            result={activeResult}
            selectedClaimIndex={selectedEvidenceClaimIndex}
            onSelectClaim={(idx) => setSelectedEvidenceClaimIndex(idx)}
            onBack={() => handleNavigate("dashboard")}
            onVerifyAgain={() => {
              setText("");
              handleNavigate("workspace");
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 px-4 sm:px-8 mt-auto text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">HalluciCheck v2.0</span>
            <span>·</span>
            <span>Multi-Source AI Hallucination Verification</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-semibold">● Multi-Source Quorum</span>
            <span>OpenAlex · PubMed · ArXiv · DuckDuckGo · Wikipedia · CrossRef</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
