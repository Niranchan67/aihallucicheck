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
        <div className="mt-3 space-y-2 rounded bg-paper px-3.5 py-3 text-sm">
          {claim.reasoning && (
            <p>
              <span className="text-ink-soft">Reasoning — </span>
              <span className="text-ink">{claim.reasoning}</span>
            </p>
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
