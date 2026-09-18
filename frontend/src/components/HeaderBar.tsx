import React from "react";
import {
  Shield,
  CheckCircle2,
  History,
  ExternalLink,
  BookOpen,
  Sparkles,
  Terminal,
} from "lucide-react";

interface HeaderBarProps {
  engineStatus: string;
  onOpenHistory: () => void;
  historyCount: number;
  onSelectPreset: (text: string) => void;
}

export function HeaderBar({
  engineStatus,
  onOpenHistory,
  historyCount,
  onSelectPreset,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-2xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Title & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                HalluciCheck v2.0
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-500 font-sans">
              AI Hallucination Verification
            </p>
          </div>
        </div>

        {/* Right Navigation & Status Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Professional Status Pill */}
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 emerald-pulse" />
            <span className="font-mono text-[11px] font-semibold tracking-wide">
              {engineStatus.toUpperCase()}
            </span>
          </div>

          {/* Quick Presets Dropdown/Button */}
          <button
            type="button"
            onClick={() =>
              onSelectPreset(
                "The specific heat capacity of water is 4.184 J/g C. Quantum entanglement allows for instantaneous faster-than-light communication across interstellar distances."
              )
            }
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Sparkles size={13} className="text-slate-400" />
            <span>Try Physics Demo</span>
          </button>

          {/* Audit History Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="btn-pill-light text-xs flex items-center gap-1.5 py-1.5 px-3.5"
            title="Open previous audit sessions"
          >
            <History size={14} className="text-slate-500" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] px-1.5 py-0.2 font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Outbound Links */}
          <a
            href="https://github.com/Niranchan67/aihallucicheck"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </header>
  );
}
