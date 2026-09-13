import { AlertTriangle, Check, HelpCircle, type LucideIcon, X } from "lucide-react";

import type { CitationStatus, ClaimStatus } from "../types";

const CLAIM_META: Record<ClaimStatus, { label: string; classes: string; Icon: LucideIcon }> = {
  verified: { label: "Verified", classes: "bg-verified-soft text-verified", Icon: Check },
  suspicious: { label: "Suspicious", classes: "bg-suspicious-soft text-suspicious", Icon: AlertTriangle },
  hallucinated: { label: "Hallucinated", classes: "bg-hallucinated-soft text-hallucinated", Icon: X },
  unverified: { label: "Unverified", classes: "bg-hairline/40 text-ink-soft", Icon: HelpCircle },
};

const CITATION_META: Record<CitationStatus, { label: string; classes: string; Icon: LucideIcon }> = {
  valid: { label: "Valid", classes: "bg-verified-soft text-verified", Icon: Check },
  fabricated: { label: "Fabricated", classes: "bg-hallucinated-soft text-hallucinated", Icon: X },
  unverified: { label: "Unverified", classes: "bg-hairline/40 text-ink-soft", Icon: HelpCircle },
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const { label, classes, Icon } = CLAIM_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${classes}`}>
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}

export function CitationStatusBadge({ status }: { status: CitationStatus }) {
  const { label, classes, Icon } = CITATION_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${classes}`}>
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}
