import React, { useEffect, useState } from "react";
import {
  Database,
  Search,
  RotateCcw,
  Trash2,
  Eye,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
} from "lucide-react";
import { listVerifications, deleteVerification, getVerification } from "../api/client";
import type { VerificationHistoryItem, VerificationResponse } from "../types";

interface SlideHistoryProps {
  onLoadReport: (res: VerificationResponse) => void;
  onNextToResearch: () => void;
}

export function SlideHistory({
  onLoadReport,
  onNextToResearch,
}: SlideHistoryProps) {
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const items = await listVerifications();
      setHistory(items);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSelect = async (id: string) => {
    try {
      const fullReport = await getVerification(id);
      onLoadReport(fullReport);
    } catch (e) {
      alert("Failed to load saved report.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(`Delete report ${id}?`)) return;
    try {
      setDeletingId(id);
      await deleteVerification(id);
      setHistory((prev) => prev.filter((item) => item.verification_id !== id));
    } catch {
      alert("Failed to delete report.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = history.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.verification_id.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q) ||
      item.snippet.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-140px)] py-6 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block mb-1 font-semibold">
            Slide 08 of 09 · Persistence &amp; Historical Records
          </span>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <Database className="text-indigo-400" size={24} />
            Verification History &amp; Reports (SQLite)
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchHistory}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-3.5 mb-4 flex items-center gap-3 shadow-md">
        <Search size={16} className="text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search reports by ID, AI model, or content snippet..."
          className="w-full bg-transparent text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
        />
        <span className="font-mono text-xs text-zinc-500 whitespace-nowrap">
          {filteredHistory.length} saved
        </span>
      </div>

      {/* Reports Table / Card List */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d12]/90 p-4 mb-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-indigo-400 animate-pulse">
            Loading verification records from SQLite...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No verification reports found. Run a verification on Slide 04 to populate historical records.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {filteredHistory.map((item) => {
              const conf = Math.round(item.overall_confidence);
              const badgeColor =
                conf >= 75
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : conf >= 45
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-400";

              return (
                <div
                  key={item.verification_id}
                  onClick={() => handleSelect(item.verification_id)}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-3.5 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {item.verification_id}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {item.model}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                        {conf}% Conf
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-1 italic">
                      "{item.snippet}..."
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers size={12} /> {item.claims_checked} claims ({item.verified_count} ver / {item.hallucinated_count} hal)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleSelect(item.verification_id)}
                      className="flex items-center gap-1.5 rounded-md bg-white text-black font-semibold px-3 py-1.5 text-xs hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
                    >
                      <Eye size={12} /> Inspect Report
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.verification_id)}
                      disabled={deletingId === item.verification_id}
                      className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Report"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNextToResearch}
          className="bg-white text-black font-semibold rounded-md px-5 py-2.5 text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-md cursor-pointer"
        >
          <span>Next: Literature Survey &amp; Tech Stack (Slide 09)</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
