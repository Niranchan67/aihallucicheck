import type { CitationResult } from "../types";
import { CitationStatusBadge } from "./StatusBadge";

export function CitationList({ citations }: { citations: CitationResult[] }) {
  if (citations.length === 0) {
    return <p className="text-sm text-ink-soft">No citations or references were detected in this text.</p>;
  }

  return (
    <ul className="divide-y divide-hairline">
      {citations.map((citation) => (
        <li key={citation.id} className="py-3">
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 flex-1 text-sm text-ink">{citation.raw_text}</p>
            <CitationStatusBadge status={citation.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
            {citation.source && <span>{citation.source}</span>}
            {citation.doi && <span className="font-mono">DOI: {citation.doi}</span>}
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-verified underline underline-offset-2"
              >
                Open source
              </a>
            )}
          </div>
          {citation.note && <p className="mt-1 text-xs text-ink-soft">{citation.note}</p>}
        </li>
      ))}
    </ul>
  );
}
