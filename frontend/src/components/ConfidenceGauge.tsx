import { useEffect, useState } from "react";

interface ConfidenceGaugeProps {
  value: number; // 0-100
}

function verdictColor(value: number): string {
  if (value >= 75) return "#2F6F4F"; // verified
  if (value >= 45) return "#B8842E"; // suspicious
  return "#A23B2E"; // hallucinated
}

export function ConfidenceGauge({ value }: ConfidenceGaugeProps) {
  const [animated, setAnimated] = useState(0);
  const radius = 72;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Animate from 0 on mount/update so the gauge always "fills in" -- the
    // one deliberate motion moment on this page.
    const raf = requestAnimationFrame(() => setAnimated(value));
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const offset = circumference - (animated / 100) * circumference;
  const color = verdictColor(value);

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#D8DBD2" strokeWidth="12" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="-mt-[112px] flex flex-col items-center">
        <span className="font-mono text-4xl font-medium text-ink">{Math.round(value)}%</span>
        <span className="mt-1 text-xs text-ink-soft">overall confidence</span>
      </div>
    </div>
  );
}
