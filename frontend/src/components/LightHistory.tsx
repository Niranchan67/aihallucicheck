import React, { useState } from "react";
import {
  History,
  Download,
  Trash2,
  ExternalLink,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import type {
  AppTab,
  VerificationResponse,
  VerificationHistoryItem,
} from "../types";

interface LightHistoryProps {
  history: (VerificationResponse | VerificationHistoryItem)[];
  onSelectAudit: (item: VerificationResponse | VerificationHistoryItem) => void;
  onDeleteAudit: (id: string) => void;
  onClearAllHistory: () => void;
  onNavigate: (tab: AppTab) => void;
}

export function LightHistory({
  history,
  onSelectAudit,
  onDeleteAudit,
  onClearAllHistory,
  onNavigate,
}: LightHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = history.filter((item) => {
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
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `HalluciCheck_Audit_History_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8 animate-fade-in">
      {/* Header & Primary Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            <History size={14} className="text-slate-700" />
            <span>Audit History &amp; Diagnostics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            Verification Session History
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            {history.length} verification sessions persisted via localStorage data bridge
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {history.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportAll}
                className="btn-pill-light px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
                title="Export all historical records as JSON"
              >
                <Download size={13} className="text-slate-600" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete all historical verification records?"
                    )
                  ) {
                    onClearAllHistory();
                  }
                }}
                className="btn-pill-light px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onNavigate("workspace")}
            className="btn-pill-dark px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={13} />
            <span>New Verification</span>
          </button>
        </div>
      </div>

      {/* Search Filter Input */}
      {history.length > 0 && (
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by Verification ID, Model, or text snippet…"
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans shadow-2xs"
          />
        </div>
      )}

      {/* Structured History Table */}
      <div className="glass-card-light rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
              <History size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-sans">
                {searchTerm
                  ? "No matching audit records found"
                  : "No verification sessions yet"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
                {searchTerm
                  ? "Try searching with a different ID, model, or claim fragment."
                  : "When you run an autonomous fact-check, your verified reports and confidence scores are indexed here."}
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onNavigate("workspace")}
                className="btn-pill-dark px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2"
              >
                <span>Run First Verification</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-mono uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Verification ID</th>
                  <th className="py-3 px-4">Origin Model</th>
                  <th className="py-3 px-4">Input Text Preview</th>
                  <th className="py-3 px-4">Claims Breakdown</th>
                  <th className="py-3 px-4">Calibrated Certainty</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredHistory.map((item, idx) => {
                  const conf = Math.round(item.overall_confidence);
                  const snippet =
                    "snippet" in item && item.snippet
                      ? item.snippet
                      : (item as VerificationResponse).claims?.[0]?.text ||
                        "Verification Report";

                  const riskBadge =
                    conf >= 80 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        <span>High Certainty</span>
                      </span>
                    ) : conf >= 50 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle size={11} className="text-amber-600" />
                        <span>Moderate Risk</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle size={11} className="text-rose-600" />
                        <span>High Risk</span>
                      </span>
                    );

                  return (
                    <tr
                      key={item.verification_id || idx}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* ID & Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-900 font-bold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{item.verification_id}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {item.created_at || "Recent Session"}
                        </div>
                      </td>

                      {/* Model */}
                      <td className="py-3.5 px-4 font-mono uppercase whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                          {item.model}
                        </span>
                      </td>

                      {/* Snippet Preview */}
                      <td className="py-3.5 px-4 text-slate-700 font-sans max-w-xs truncate">
                        {snippet}
                      </td>

                      {/* Claims Breakdown */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-700 font-bold">
                            {item.verified_count}V
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="text-amber-700 font-bold">
                            {item.suspicious_count}S
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-700 font-bold">
                            {item.hallucinated_count}H
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            ({item.claims_checked} total)
                          </span>
                        </div>
                      </td>

                      {/* Score & Risk */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 text-sm tabular-nums">
                            {conf}%
                          </span>
                          {riskBadge}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectAudit(item)}
                            className="btn-pill-dark px-3 py-1 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                            title="Inspect complete results dashboard"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteAudit(item.verification_id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
