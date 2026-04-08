"use client";

import { useEffect, useState } from "react";

const STAGES = [
  { label: "Finding vendors",         until: 12 },
  { label: "Researching vendor sites", until: 28 },
  { label: "Analyzing trade-offs",    until: 50 },
  { label: "Diving into build challenges", until: 75 },
  { label: "Wrapping up",             until: 90 },
];

export default function AnalysisProgressBar({ done }: { done: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (done) { setProgress(100); return; }

    const start = Date.now();
    const DURATION = 150_000; // ~150s (~2.5 mins) to reach 90%

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / DURATION, 1);
      // ease-out curve so it slows near the end
      const eased = 1 - Math.pow(1 - t, 2.5);
      setProgress(Math.min(eased * 90, 90));
    };

    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [done]);

  const stage = STAGES.findLast((s) => progress >= s.until - (s.until - (STAGES[STAGES.indexOf(s) - 1]?.until ?? 0)))
    ?? STAGES[0];
  const label = done ? "Analysis complete" : (STAGES.findLast((s) => progress + 5 >= s.until) ?? STAGES[0]).label;

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500">{label}...</span>
        <span className="text-xs font-mono text-gray-400">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            width: `${progress}%`,
            background: done
              ? "linear-gradient(90deg, #22c55e, #16a34a)"
              : "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)",
            transition: done ? "width 0.4s ease" : "width 0.8s ease-out",
          }}
        >
          {!done && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.6s infinite linear",
              }}
            />
          )}
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
