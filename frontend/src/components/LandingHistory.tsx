import React, { useEffect, useState } from "react";
import { Database, Search, RotateCcw, Trash2, ArrowUpRight } from "lucide-react";
import { listVerifications, deleteVerification, getVerification } from "../api/client";
import type { VerificationHistoryItem, VerificationResponse } from "../types";

interface LandingHistoryProps {
  onLoadReport: (res: VerificationResponse) => void;
}

export function LandingHistory({ onLoadReport }: LandingHistoryProps) {
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
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
      const el = document.getElementById("workstation");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      alert("Failed to load saved report.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(`Delete report ${id}?`)) return;
    try {
      setDeletingId(id);
      await deleteVerification(id);
      setHistory((prev) => prev.filter((h) => h.verification_id !== id));
    } catch {
      alert("Failed to delete record.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = history.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.verification_id.toLowerCase().includes(term) ||
      (item.snippet && item.snippet.toLowerCase().includes(term)) ||
      item.model.toLowerCase().includes(term)
    );
  });

  return (
    <section id="history" className="py-20 md:py-24 border-b border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Audit History and Saved Reports
            </h2>
            <p className="mt-3 text-base sm:text-lg text-zinc-400 leading-relaxed">
              Persisted verification sessions in SQLite and local storage. Reload any past audit into the workstation or review past precision scores.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-200 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
          >
            <RotateCcw size={12} className={loading ? "animate-spin" : ""} />
            <span>Refresh Records</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search past reports by topic or ID..."
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* History Table or List */}
        {loading ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-8 text-center text-xs font-mono text-zinc-400">
            Loading verification history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-8 text-center space-y-3">
            <Database size={28} className="mx-auto text-zinc-400" />
            <h3 className="text-sm font-bold text-white">No Historical Audits Recorded Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Run your first verification in the workstation above. Every analyzed assertion is automatically saved here for future reference.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.verification_id}
                onClick={() => handleSelect(item.verification_id)}
                className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5 hover:border-indigo-500/50 hover:bg-zinc-900/60 transition-all cursor-pointer flex flex-col justify-between group space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-indigo-400 font-bold">{item.verification_id}</span>
                    <span className="text-zinc-400">{item.model}</span>
                  </div>
                  <p className="text-xs text-zinc-300 line-clamp-2 font-sans">
                    "{item.snippet || 'Factual statement audit session'}"
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{Math.round((item.overall_confidence || 0) * 100)}%</span>
                    <span className="text-zinc-400">({item.claims_checked} claims)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.verification_id)}
                      disabled={deletingId === item.verification_id}
                      className="p-1 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className="inline-flex items-center text-zinc-400 group-hover:text-white transition-colors">
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
