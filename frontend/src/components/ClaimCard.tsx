import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { ClaimResult } from "../types";
import { ClaimStatusBadge } from "./StatusBadge";

export function ClaimCard({ claim, index }: { claim: ClaimResult; index: number }) {
  const [open, setOpen] = useState(false);
  const hasDetails = Boolean(claim.evidence || claim.source || claim.source_url || claim.reasoning);

  return (
    <li className="border-b border-hairline py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((o) => !o)}
        className={`flex w-full items-start justify-between gap-4 text-left ${
          hasDetails ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="min-w-0">
          <span className="font-mono text-xs text-ink-soft">Claim {index + 1}</span>
          <p className="mt-1 text-[15px] leading-snug text-ink">{claim.text}</p>
          <div className="mt-2 flex items-center gap-2">
            <ClaimStatusBadge status={claim.status} />
            {claim.status !== "unverified" && (
              <span className="font-mono text-xs text-ink-soft">{claim.confidence}% confidence</span>
            )}
          </div>
        </div>
        {hasDetails && (
          <ChevronDown
            size={18}
            className={`mt-1 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && hasDetails && (
        <div className="mt-3 space-y-3 rounded bg-paper px-3.5 py-3 text-sm">
          {claim.contradiction_details && (
            <div className="rounded border border-contradicted/40 bg-contradicted/10 p-2 text-xs text-contradicted">
              <span className="font-semibold">Contradiction: </span>
              <span>{claim.contradiction_details}</span>
            </div>
          )}
          {claim.reasoning && (
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-ink-soft block mb-1">
                Factual Reasoning
              </span>
              <div className="space-y-1.5 text-ink leading-relaxed">
                {claim.reasoning.split("\n\n").map((p, pi) => (
                  <p key={pi}>{p.trim()}</p>
                ))}
              </div>
            </div>
          )}
          {claim.authority_checks && claim.authority_checks.length > 0 && (
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-ink-soft block mb-1">
                Authority Registry Checks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {claim.authority_checks.map((a, ai) => (
                  <span
                    key={ai}
                    className="inline-flex items-center gap-1 rounded bg-paper-subtle px-2 py-0.5 text-[11px] font-mono text-ink-soft"
                  >
                    <span>{a.dataset}</span>
                    <span>({a.authority_tier.toFixed(2)})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {claim.propositions_evaluated && claim.propositions_evaluated.length > 0 && (
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-ink-soft block mb-1">
                Proposition Evaluations ({claim.propositions_evaluated.filter((p) => p.status === "supported" || p.status === "corroborated").length}/
                {claim.propositions_evaluated.length} supported)
              </span>
              <ul className="space-y-1 text-xs">
                {claim.propositions_evaluated.map((prop, pi) => (
                  <li key={pi} className="flex items-center justify-between gap-2 rounded bg-paper-subtle px-2 py-1">
                    <span className="text-ink truncate">{prop.statement}</span>
                    <span
                      className={`font-mono text-[10px] uppercase font-bold ${
                        prop.status === "supported" || prop.status === "corroborated"
                          ? "text-verified"
                          : prop.status === "contradicted"
                          ? "text-contradicted"
                          : "text-amber-500"
                      }`}
                    >
                      {prop.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {claim.evidence && (
            <p>
              <span className="text-ink-soft">Evidence — </span>
              <span className="text-ink">{claim.evidence}</span>
            </p>
          )}
          {claim.source && (
            <p>
              <span className="text-ink-soft">Source — </span>
              <span className="text-ink">{claim.source}</span>
              {claim.source_url && (
                <>
                  <span className="text-ink-soft"> · </span>
                  <a href={claim.source_url} target="_blank" rel="noopener noreferrer" className="text-verified underline underline-offset-2">Open evidence</a>
                </>
              )}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
