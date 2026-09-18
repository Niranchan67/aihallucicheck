import React, { useEffect, useState } from "react";
import { Shield, Menu, Terminal, BarChart3, Compass, History, Sparkles } from "lucide-react";
import { getHealth, verifyContent, getVerification } from "./api/client";
import { AppSidebar } from "./components/AppSidebar";
import { WorkspaceHub } from "./components/WorkspaceHub";
import { AnalysisConsole } from "./components/AnalysisConsole";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { AuditHistory } from "./components/AuditHistory";
import type {
  WorkspaceView,
  VerificationRequest,
  VerificationResponse,
  VerificationHistoryItem,
} from "./types";

const LAST_RESULT_KEY = "hallucicheck_last_result";
const HISTORY_KEY = "hallucicheck_history";

export default function App() {
  const [currentView, setCurrentView] = useState<WorkspaceView>("hub");
  const [activeResult, setActiveResult] = useState<VerificationResponse | null>(null);
  const [history, setHistory] = useState<(VerificationResponse | VerificationHistoryItem)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState("Checking...");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [consoleInitialText, setConsoleInitialText] = useState("");

  // 1. Initial LocalStorage Bridge & System Health
  useEffect(() => {
    // Engine health check
    getHealth()
      .then((res) => {
        setEngineStatus(res.status === "online" ? "Live Multi-Source v2.4" : "Standby (Client Engine)");
      })
      .catch(() => {
        setEngineStatus("Client Engine Active");
      });

    // Load last result from localStorage gracefully
    try {
      const savedResult = localStorage.getItem(LAST_RESULT_KEY);
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        if (parsed && typeof parsed === "object" && parsed.verification_id) {
          setActiveResult(parsed);
        }
      }
    } catch {
      // Ignore corrupted json
    }

    // Load history from localStorage gracefully
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsedHist = JSON.parse(savedHistory);
        if (Array.isArray(parsedHist)) {
          setHistory(parsedHist);
        }
      }
    } catch {
      // Ignore corrupted json
    }

    // Sync URL Hash
    const hash = window.location.hash.replace("#", "") as WorkspaceView;
    if (["hub", "console", "results", "history"].includes(hash)) {
      setCurrentView(hash);
    } else {
      setCurrentView("hub");
      window.location.hash = "hub";
    }

    // Global keyboard shortcuts: Cmd+N / Ctrl+N for new audit, Escape to close overlays
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewAudit();
      }
      if (e.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = (view: WorkspaceView) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  const handleNewAudit = () => {
    setConsoleInitialText("");
    navigate("console");
  };

  const handleNavigateToConsole = (initialText?: string) => {
    if (initialText !== undefined) {
      setConsoleInitialText(initialText);
    }
    navigate("console");
  };

  // 2. Verification Execution Workflow
  const handleStartVerification = async (payload: VerificationRequest) => {
    setIsProcessing(true);
    setError(null);
    navigate("console");

    try {
      const data = await verifyContent(payload);
      setActiveResult(data);
      setIsProcessing(false);

      // Persist to localStorage data bridge
      try {
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(data));
      } catch {}

      // Update history list
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

      // Automatically transition to Results Dashboard
      navigate("results");
    } catch (err: any) {
      setIsProcessing(false);
      setError(
        err.message ||
          "Failed to verify content across consensus sources. Check backend connection and try again."
      );
    }
  };

  // 3. Select historical verification
  const handleSelectHistoryItem = async (item: VerificationResponse | VerificationHistoryItem) => {
    if ("claims" in item && Array.isArray(item.claims)) {
      setActiveResult(item as VerificationResponse);
      try {
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(item));
      } catch {}
      navigate("results");
    } else {
      // Fetch full details if only snippet exists
      try {
        const full = await getVerification(item.verification_id);
        setActiveResult(full);
        try {
          localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(full));
        } catch {}
        navigate("results");
      } catch {
        navigate("results");
      }
    }
  };

  // 4. Delete & Clear History
  const handleDeleteHistoryItem = (id: string) => {
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

  return (
    <div className="min-h-screen bg-[#090d16] text-zinc-100 flex flex-col md:flex-row antialiased relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient Radial Mesh Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="ambient-glow-mesh top-[-100px] left-1/3 -translate-x-1/2" />
        <div className="absolute bottom-[-100px] -right-20 w-[550px] h-[450px] rounded-full bg-emerald-950/20 blur-[130px]" />
      </div>

      {/* Mobile Top Navigation Header */}
      <header className="md:hidden h-14 border-b border-white/10 bg-[#090d16]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield size={17} />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">HalluciCheck</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
            v2.4
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-white cursor-pointer"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Sleek Left Sidebar (ChatGPT / Claude Web App UI) */}
      <AppSidebar
        currentView={currentView}
        onNavigate={navigate}
        onNewAudit={handleNewAudit}
        activeResult={activeResult}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        engineStatus={engineStatus}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Stage Panel */}
      <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-56px)] md:h-screen overflow-y-auto">
        {currentView === "hub" && (
          <WorkspaceHub
            onStartVerification={handleStartVerification}
            onNavigateToConsole={handleNavigateToConsole}
            onSelectHistoryItem={handleSelectHistoryItem}
            history={history}
            engineStatus={engineStatus}
          />
        )}

        {currentView === "console" && (
          <AnalysisConsole
            onStartVerification={handleStartVerification}
            isProcessing={isProcessing}
            error={error}
            initialText={consoleInitialText}
          />
        )}

        {currentView === "results" && (
          <ResultsDashboard
            result={activeResult}
            onVerifyAgain={() => navigate("console")}
            onSelectPreset={(sample) =>
              handleStartVerification({
                text: sample,
                model: "chatgpt",
                verify_claims: true,
                verify_citations: true,
                verify_statistics: true,
              })
            }
          />
        )}

        {currentView === "history" && (
          <AuditHistory
            history={history}
            onSelectAudit={handleSelectHistoryItem}
            onDeleteAudit={handleDeleteHistoryItem}
            onClearAllHistory={handleClearAllHistory}
            onNavigateToConsole={handleNewAudit}
          />
        )}
      </main>
    </div>
  );
}
