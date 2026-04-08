"use client";

import { Persona, PersonaView } from "@/types/analysis";

const PERSONA_META: Record<Persona, { label: string; accentClass: string; badgeClass: string }> = {
  exec:        { label: "Executive View",    accentClass: "border-violet-200 bg-violet-50",  badgeClass: "bg-violet-100 text-violet-700" },
  product:     { label: "Product View",      accentClass: "border-blue-200 bg-blue-50",      badgeClass: "bg-blue-100 text-blue-700" },
  engineering: { label: "Engineering View",  accentClass: "border-emerald-200 bg-emerald-50", badgeClass: "bg-emerald-100 text-emerald-700" },
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-5">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
      <div className="grid grid-cols-2 gap-2 mt-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-3 bg-gray-100 rounded" />)}
      </div>
    </div>
  );
}

export default function PersonaViewCard({
  persona,
  view,
}: {
  persona: Persona;
  view: PersonaView | undefined;
}) {
  const meta = PERSONA_META[persona];

  return (
    <div className={`rounded-2xl border ${meta.accentClass} overflow-hidden`}>
      <div className="px-5 pt-4 pb-1 flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
          {meta.label}
        </span>
        {!view && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse inline-block" />
            Generating…
          </span>
        )}
      </div>

      {!view ? (
        <Skeleton />
      ) : (
        <div className="px-5 pb-5 pt-2 space-y-4">
          {/* Headline */}
          <p className="font-semibold text-gray-900 text-base leading-snug">{view.headline}</p>

          {/* Summary */}
          <p className="text-sm text-gray-600 leading-relaxed">{view.summary}</p>

          {/* Key points */}
          <ul className="space-y-1.5">
            {view.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-400 mt-0.5 shrink-0">—</span>
                {point}
              </li>
            ))}
          </ul>

          {/* Recommendation */}
          <div className="bg-white bg-opacity-70 rounded-xl px-4 py-3 border border-white">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommendation</p>
            <p className="text-sm text-gray-800">{view.recommendation}</p>
          </div>

          {/* Watch-outs */}
          {view.watch_out?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Watch out for</p>
              <ul className="space-y-1">
                {view.watch_out.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
