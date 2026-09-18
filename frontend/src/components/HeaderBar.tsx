import React from "react";
import {
  Shield,
  LayoutGrid,
  FileText,
  BarChart3,
  History,
  ExternalLink,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { AppTab } from "../types";

interface HeaderBarProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  engineStatus: string;
  historyCount: number;
}

export function HeaderBar({
  activeTab,
  onNavigate,
  engineStatus,
  historyCount,
}: HeaderBarProps) {
  const navTabs: { id: AppTab; label: string; icon: LucideIcon }[] = [
    { id: "home", label: "Home", icon: LayoutGrid },
    { id: "workspace", label: "Workspace", icon: FileText },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3 shadow-2xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Title & Tagline */}
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-slate-800 transition-colors">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                HalluciCheck
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                v2.0
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 font-sans">
              AI Hallucination Verification Engine
            </p>
          </div>
        </button>

        {/* Center Multi-View Navigation Tabs */}
        <nav
          aria-label="Application Views"
          className="flex items-center p-1 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-inner"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs rounded-full transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/60 font-medium"
                }`}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-slate-500"} />
                <span>{tab.label}</span>
                {tab.id === "history" && historyCount > 0 && (
                  <span
                    className={`ml-1 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {historyCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Navigation & Status Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3">

          {/* Professional Status Pill */}
          <div className="hidden md:inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 emerald-pulse" />
            <span className="font-mono text-[11px] font-semibold tracking-wide">
              {engineStatus.toUpperCase()}
            </span>
          </div>

          {/* Outbound Links */}
          <a
            href="https://github.com/Niranchan67/aihallucicheck"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </header>
  );
}
