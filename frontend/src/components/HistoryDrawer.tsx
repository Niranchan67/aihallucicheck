import React, { useState } from "react";
import {
  X,
  History,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import type { VerificationResponse, VerificationHistoryItem } from "../types";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: (VerificationResponse | VerificationHistoryItem)[];
  onSelectAudit: (item: VerificationResponse | VerificationHistoryItem) => void;
  onDeleteAudit: (id: string) => void;
  onClearAllHistory: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelectAudit,
  onDeleteAudit,
  onClearAllHistory,
}: HistoryDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filtered = history.filter((item) => {
    const text =
      "snippet" in item && item.snippet
        ? item.snippet
        : (item as VerificationResponse).claims?.[0]?.text || "";
    const id = item.verification_id || "";
    const model = item.model || "";
    const query = searchTerm.toLowerCase();
    return (
      id.toLowerCase().includes(query) ||
      model.toLowerCase().includes(query) ||
      text.toLowerCase().includes(query)
    );
  });

  const handleExportAll = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `HalluciCheck_History_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between">
          {/* Top Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
                <History size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  Verification History
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {history.length} session{history.length === 1 ? "" : "s"} recorded
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Box */}
          <div className="px-5 pt-4 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search scans by text, ID, model…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white font-sans transition-all"
              />
            </div>
          </div>

          {/* Scrollable Scans List */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-mono">
                {searchTerm ? "No matching audit records found." : "No saved audits in localStorage."}
              </div>
            ) : (
              filtered.map((item, idx) => {
                const conf = Math.round(item.overall_confidence);
                const snippet =
                  "snippet" in item && item.snippet
                    ? item.snippet
                    : (item as VerificationResponse).claims?.[0]?.text || "Verification Report";

                return (
                  <div
                    key={item.verification_id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-900">{item.verification_id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          conf >= 75
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : conf >= 45
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {conf}% Certainty
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 font-sans leading-relaxed">
                      {snippet}
                    </p>

                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400 uppercase">
                        {item.model} · {item.claims_checked} claims
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectAudit(item);
                            onClose();
                          }}
                          className="btn-pill-dark text-[11px] py-1 px-3 shadow-none font-medium"
                        >
                          Load Report
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAudit(item.verification_id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete from log"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={handleExportAll}
              disabled={history.length === 0}
              className="btn-pill-light text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export All JSON</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm("Purge all verification session logs from localStorage?")) {
                  onClearAllHistory();
                }
              }}
              disabled={history.length === 0}
              className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium p-1 cursor-pointer"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
