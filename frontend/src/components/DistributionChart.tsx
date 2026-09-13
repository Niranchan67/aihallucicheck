import React from "react";

export function DistributionChart({ counts }: any) {
  const safeCounts = counts || {};
  const verified = safeCounts.verified ?? safeCounts.True ?? safeCounts.verified_count ?? 0;
  const suspicious = safeCounts.suspicious ?? safeCounts.Warning ?? safeCounts.suspicious_count ?? 0;
  const hallucinated = safeCounts.hallucinated ?? safeCounts.False ?? safeCounts.hallucinated_count ?? 0;

  const total = (safeCounts.all ?? safeCounts.total ?? (verified + suspicious + hallucinated)) || 1;

  const verifiedPct = Math.round((verified / total) * 100);
  const suspiciousPct = Math.round((suspicious / total) * 100);
  const hallucinatedPct = Math.max(0, 100 - verifiedPct - suspiciousPct);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4 w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-zinc-200">Claim Status Distribution</p>
        <span className="text-xs text-zinc-500 tabular-nums">{total} total claims</span>
      </div>

      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/10 gap-0.5 mb-3">
        <div
          style={{ width: `${verifiedPct}%` }}
          className="bg-emerald-400 transition-all duration-500"
          title={`Verified: ${verifiedPct}%`}
        />
        <div
          style={{ width: `${suspiciousPct}%` }}
          className="bg-amber-400 transition-all duration-500"
          title={`Suspicious: ${suspiciousPct}%`}
        />
        <div
          style={{ width: `${hallucinatedPct}%` }}
          className="bg-rose-400 transition-all duration-500"
          title={`Hallucinated: ${hallucinatedPct}%`}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-zinc-400">Verified ({verifiedPct}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-zinc-400">Suspicious ({suspiciousPct}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="text-zinc-400">Hallucinated ({hallucinatedPct}%)</span>
        </div>
      </div>
    </div>
  );
}

export default DistributionChart;