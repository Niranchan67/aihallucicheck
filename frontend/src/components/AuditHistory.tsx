import React, { useState } from "react";
import {
  History,
  Download,
  Trash2,
  ExternalLink,
  RotateCcw,
  Search,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  BarChart3,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { VerificationResponse, VerificationHistoryItem } from "../types";

interface AuditHistoryProps {
  history: (VerificationResponse | VerificationHistoryItem)[];
  onSelectAudit: (item: VerificationResponse | VerificationHistoryItem) => void;
  onDeleteAudit: (id: string) => void;
  onClearAllHistory: () => void;
  onNavigateToConsole: () => void;
}

export function AuditHistory({
  history,
  onSelectAudit,
  onDeleteAudit,
  onClearAllHistory,
  onNavigateToConsole,
}: AuditHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = history.filter((item) => {
    const text = "snippet" in item && item.snippet ? item.snippet : (item as VerificationResponse).claims?.[0]?.text || "";
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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `HalluciCheck_Audit_History_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <History size={14} />
            <span>Persistence &amp; Audit Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verification Session History
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Persisted audits saved via localStorage data bridge ({history.length} total recorded)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportAll}
                className="btn-glass px-3.5 py-2 text-xs font-mono flex items-center gap-1.5"
                title="Export all historical records as JSON"
              >
                <Download size={13} />
                <span>Export All Logs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all verification session logs?")) {
                    onClearAllHistory();
                  }
                }}
                className="btn-glass px-3 py-2 text-xs font-mono text-rose-400 hover:text-rose-300 hover:border-rose-500/30 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Clear History</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onNavigateToConsole}
            className="btn-cyan-gradient px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Search Input Filter */}
      {history.length > 0 && (
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, Model, or text snippet..."
            className="w-full rounded-xl border border-white/10 bg-[#080d1a] pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      )}

      {/* History Table Container */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center mx-auto">
              <History size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Audit Records Found</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-mono">
                {searchTerm
                  ? "No previous audits match your search query."
                  : "All verification logs will be automatically indexed here across browser sessions."}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToConsole}
              className="btn-cyan-gradient px-5 py-2 text-xs font-semibold"
            >
              Run Your First Verification
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">Verification ID</th>
                  <th className="py-3 px-4">Origin Model</th>
                  <th className="py-3 px-4">Text Sample Preview</th>
                  <th className="py-3 px-4">Claims Breakdown</th>
                  <th className="py-3 px-4">Certainty &amp; Risk Rating</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredHistory.map((item, idx) => {
                  const conf = Math.round(item.overall_confidence);
                  const snippet =
                    "snippet" in item && item.snippet
                      ? item.snippet
                      : (item as VerificationResponse).claims?.[0]?.text || "Verification Report";

                  const riskBadge =
                    conf >= 75 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck size={11} /> High Certainty
                      </span>
                    ) : conf >= 45 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle size={11} /> Moderate Risk
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <XCircle size={11} /> High Hallucination
                      </span>
                    );

                  return (
                    <tr
                      key={item.verification_id || idx}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold whitespace-nowrap">
                        {item.verification_id}
                        <div className="text-[10px] text-zinc-400 font-normal">
                          {item.created_at || "Recent Session"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-300 uppercase whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[11px]">
                          {item.model}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-200 font-sans max-w-xs truncate">
                        {snippet}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-300 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-400 font-semibold">{item.verified_count}V</span>
                          <span className="text-zinc-400">/</span>
                          <span className="text-amber-400 font-semibold">{item.suspicious_count}S</span>
                          <span className="text-zinc-400">/</span>
                          <span className="text-rose-400 font-semibold">{item.hallucinated_count}H</span>
                          <span className="text-zinc-400 text-[10px]">({item.claims_checked} total)</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{conf}%</span>
                          {riskBadge}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectAudit(item)}
                            className="btn-cyan-gradient px-3 py-1 text-xs font-semibold flex items-center gap-1"
                            title="Inspect full verification dashboard"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteAudit(item.verification_id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete session from log"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
