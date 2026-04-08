"use client";

import { useRef, useState } from "react";
import { AnalysisResult } from "@/types/analysis";
import ShareCard from "./ShareCard";

export default function ExportButton({ result, problem }: { result: AnalysisResult; problem: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        width: 1200,
        height: 630,
        scale: 1,
        useCORS: true,
        backgroundColor: "#0a0a0a",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = "buyvsbuild-analysis.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleExport}
        disabled={loading}
        className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 disabled:opacity-40"
      >
        {loading ? (
          <>
            <span className="w-3 h-3 rounded-full bg-gray-400 animate-pulse inline-block" />
            Exporting...
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Share
          </>
        )}
      </button>
      <ShareCard result={result} problem={problem} cardRef={cardRef} />
    </>
  );
}
