"use client";

import { Persona, PersonaView } from "@/types/analysis";

const PERSONA_META: Record<Persona, { label: string; accent: string; border: string }> = {
  exec:        { label: "Executive View",    accent: "bg-violet-50",  border: "border-violet-100" },
  product:     { label: "Product View",      accent: "bg-blue-50",    border: "border-blue-100" },
  engineering: { label: "Engineering View",  accent: "bg-emerald-50", border: "border-emerald-100" },
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      <div className="h-4 bg-muted rounded-lg w-3/4" />
      <div className="h-3 bg-muted rounded-lg w-full" />
      <div className="h-3 bg-muted rounded-lg w-5/6" />
      <div className="grid grid-cols-2 gap-2 mt-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-3 bg-muted rounded-lg" />)}
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

  if (!view) return <Skeleton />;

  return (
    <div className={`${meta.accent} ${meta.border} border-t`}>
      <div className="px-6 py-5 space-y-5">

        {/* Headline */}
        <p className="font-bold text-foreground text-lg leading-snug">{view.headline}</p>

        {/* Summary */}
        <p className="text-sm text-foreground/80 leading-relaxed">{view.summary}</p>

        {/* Key points */}
        <ul className="space-y-2">
          {view.key_points.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="text-muted-foreground mt-1 shrink-0 text-xs">—</span>
              <span className="leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>

        {/* Recommendation */}
        <div className="bg-card/80 rounded-xl px-4 py-3.5 border border-border/60">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Recommendation</p>
          <p className="text-sm text-foreground leading-relaxed">{view.recommendation}</p>
        </div>

        {/* Watch-outs */}
        {view.watch_out?.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Watch out for</p>
            <ul className="space-y-1.5">
              {view.watch_out.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-amber-500 shrink-0 mt-0.5 text-xs">⚠</span>
                  <span className="leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
