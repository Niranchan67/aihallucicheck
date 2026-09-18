import React from "react";
import {
  Shield,
  Plus,
  Compass,
  Terminal,
  BarChart3,
  History,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Database,
  Search,
  BookOpen,
  Layers,
  X,
} from "lucide-react";
import type { WorkspaceView, VerificationResponse, VerificationHistoryItem } from "../types";

interface AppSidebarProps {
  currentView: WorkspaceView;
  onNavigate: (view: WorkspaceView) => void;
  onNewAudit: () => void;
  activeResult: VerificationResponse | null;
  history: (VerificationResponse | VerificationHistoryItem)[];
  onSelectHistoryItem: (item: VerificationResponse | VerificationHistoryItem) => void;
  engineStatus: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({
  currentView,
  onNavigate,
  onNewAudit,
  activeResult,
  history,
  onSelectHistoryItem,
  engineStatus,
  isOpenMobile,
  onCloseMobile,
}: AppSidebarProps) {
  const navItems: { id: WorkspaceView; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: "hub",
      label: "Workspace Hub",
      icon: <Compass size={17} />,
    },
    {
      id: "console",
      label: "Analysis Console",
      icon: <Terminal size={17} />,
    },
    {
      id: "results",
      label: "Results Dashboard",
      icon: <BarChart3 size={17} />,
      badge: activeResult ? `${Math.round(activeResult.overall_confidence)}%` : undefined,
    },
    {
      id: "history",
      label: "Audit History",
      icon: <History size={17} />,
      badge: history.length > 0 ? `${history.length}` : undefined,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#090d16]/95 border-r border-white/10 backdrop-blur-2xl transition-all duration-300 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-white/10 px-5 flex items-center justify-between shrink-0">
          <div
            onClick={() => {
              onNavigate("hub");
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:scale-105 group-hover:border-cyan-400 transition-all">
              <Shield size={19} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight font-sans">
                  HalluciCheck
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Autonomous Fact Verifier</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Action Button (+ New Audit) */}
        <div className="p-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              onNewAudit();
              onCloseMobile();
            }}
            className="w-full btn-cyan-gradient py-2.5 px-4 text-xs flex items-center justify-between shadow-lg shadow-cyan-500/20 group"
          >
            <div className="flex items-center gap-2 font-semibold">
              <Plus size={16} className="text-zinc-950 group-hover:rotate-90 transition-transform" />
              <span>New Audit</span>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-zinc-900 font-bold">
              ⌘N
            </span>
          </button>
        </div>

        {/* Workspace Navigation Views */}
        <div className="px-3 space-y-1 shrink-0">
          <div className="px-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Workspace Views
          </div>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? "text-cyan-400" : "text-zinc-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                        : "bg-zinc-800/80 text-zinc-400 border-zinc-700/60"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Center: Recent Audits */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-2 border-t border-white/5 mt-4">
          <div className="flex items-center justify-between px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            <span>Recent Audits</span>
            <span className="text-[9px] text-zinc-400">{history.length}</span>
          </div>

          {history.length === 0 ? (
            <div className="px-3 py-4 text-center text-zinc-400 text-xs font-mono">
              No recent scans recorded. Run a verification to populate.
            </div>
          ) : (
            <div className="space-y-1">
              {history.slice(0, 8).map((h, i) => {
                const conf = Math.round(h.overall_confidence);
                const isSelected = activeResult?.verification_id === h.verification_id;
                const snippet = "snippet" in h && h.snippet ? h.snippet : (h as VerificationResponse).claims?.[0]?.text || "AI Verification Report";

                return (
                  <button
                    key={h.verification_id || i}
                    type="button"
                    onClick={() => {
                      onSelectHistoryItem(h);
                      onCloseMobile();
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer group ${
                      isSelected
                        ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-200"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="text-zinc-400 truncate max-w-[120px]">
                        {h.verification_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          conf >= 75
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : conf >= 45
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {conf}%
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 truncate line-clamp-1 group-hover:text-white transition-colors">
                      {snippet}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Provider Health & System Status Box */}
        <div className="p-3 border-t border-white/10 shrink-0 bg-black/40">
          <div className="p-2.5 rounded-lg border border-white/10 bg-[#0d121f]/90 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 neon-pulse-emerald" />
                <span>Multi-Source Quorum</span>
              </span>
              <span className="text-emerald-400 text-[10px]">Active</span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1 text-zinc-400">
                <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
                <span className="truncate">Wikipedia REST</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
                <span className="truncate">CrossRef DOI</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
                <span className="truncate">DuckDuckGo</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
                <span className="truncate">EuropePMC</span>
              </div>
            </div>
          </div>

          {/* GitHub Source Footer Link */}
          <div className="flex items-center justify-between px-2 pt-3 text-[11px] font-mono text-zinc-400">
            <span>HalluciCheck Suite</span>
            <a
              href="https://github.com/Niranchan67/aihallucicheck"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
