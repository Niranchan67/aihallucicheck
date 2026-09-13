import { useEffect, useState } from "react";
import { AlertTriangle, Check, Circle } from "lucide-react";

// This mirrors main.py's _PIPELINE_STAGES exactly. The backend runs the whole
// pipeline in a single request/response -- it doesn't stream per-stage
// progress -- so this component cycles through the real stage names as a
// waiting indicator rather than pretending to know when each stage finished.
// When the request resolves, every stage snaps to "done" at once; on error,
// whichever stage was showing is marked failed.
const STAGES = [
  "Input received",
  "Parsing response",
  "Extracting claims",
  "Searching trusted sources",
  "Citation validation",
  "Calculating confidence",
  "Report generated",
];

interface ProgressPipelineProps {
  status: "running" | "done" | "error";
}

export function ProgressPipeline({ status }: ProgressPipelineProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 650);
    return () => window.clearInterval(id);
  }, [status]);

  const doneCount = status === "done" ? STAGES.length : activeIndex;

  return (
    <div className="rounded border border-hairline bg-white px-5 py-4">
      <p className="mb-3 text-sm text-ink-soft">
        {status === "error" ? "Verification could not be completed" : "Running verification pipeline…"}
      </p>
      <ol className="space-y-2">
        {STAGES.map((stage, i) => {
          const isDone = i < doneCount || status === "done";
          const isActive = !isDone && i === activeIndex && status === "running";
          const isFailed = status === "error" && i === activeIndex;

          return (
            <li key={stage} className="flex items-center gap-2.5 text-sm">
              {isFailed ? (
                <AlertTriangle size={16} className="shrink-0 text-hallucinated" />
              ) : isDone ? (
                <Check size={16} className="shrink-0 text-verified" />
              ) : (
                <Circle
                  size={14}
                  className={`ml-0.5 shrink-0 ${isActive ? "animate-pulse text-ink" : "text-hairline"}`}
                  fill={isActive ? "currentColor" : "none"}
                />
              )}
              <span
                className={
                  isFailed
                    ? "text-hallucinated"
                    : isDone
                      ? "text-ink"
                      : isActive
                        ? "text-ink"
                        : "text-ink-soft"
                }
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
