import { useMemo, useState } from "react";

import type { ClaimResult, ClaimStatus } from "../types";
import { ClaimCard } from "./ClaimCard";

type Filter = "all" | ClaimStatus;
type Sort = "order" | "highest" | "lowest";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "suspicious", label: "Suspicious" },
  { value: "hallucinated", label: "Hallucinated" },
];

export function ClaimList({ claims }: { claims: ClaimResult[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("order");

  const visible = useMemo(() => {
    const withIndex = claims.map((claim, index) => ({ claim, index }));
    const filtered = filter === "all" ? withIndex : withIndex.filter((c) => c.claim.status === filter);

    if (sort === "highest") return [...filtered].sort((a, b) => b.claim.confidence - a.claim.confidence);
    if (sort === "lowest") return [...filtered].sort((a, b) => a.claim.confidence - b.claim.confidence);
    return filtered;
  }, [claims, filter, sort]);

  if (claims.length === 0) {
    return <p className="text-sm text-ink-soft">No verifiable factual claims were detected.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded px-2.5 py-1 text-sm transition-colors ${
                filter === f.value ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded border border-hairline bg-white px-2 py-1 text-sm text-ink-soft"
        >
          <option value="order">Claim order</option>
          <option value="highest">Highest confidence</option>
          <option value="lowest">Lowest confidence</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-ink-soft">No claims match this filter.</p>
      ) : (
        <ul>
          {visible.map(({ claim, index }) => (
            <ClaimCard key={claim.id} claim={claim} index={index} />
          ))}
        </ul>
      )}
    </div>
  );
}
