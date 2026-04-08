import { StrategicOption, OptionType } from "@/types/analysis";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const typeConfig: Record<OptionType, { accent: string; badgeClass: string; dot: string }> = {
  "Buy":                { accent: "border-l-blue-400",   badgeClass: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-400" },
  "Build":              { accent: "border-l-violet-400", badgeClass: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-400" },
  "Build + Components": { accent: "border-l-purple-400", badgeClass: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  "Hybrid":             { accent: "border-l-amber-400",  badgeClass: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
};

const riskBadge: Record<string, string> = {
  Low:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High:   "bg-red-50 text-red-700 border-red-200",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

function OptionCard({ option, index }: { option: StrategicOption; index: number }) {
  const config = typeConfig[option.type] ?? typeConfig["Hybrid"];

  return (
    <div className={`bg-card rounded-2xl border border-border shadow-sm overflow-hidden border-l-4 ${config.accent}`}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Option {index + 1}</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {option.type}
            </span>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${riskBadge[option.risk_level]}`}>
              {option.risk_level} risk
            </span>
            {option.complexity && (
              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${riskBadge[option.complexity]}`}>
                {option.complexity} complexity
              </span>
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground leading-tight mb-1.5">{option.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{option.tagline}</p>
      </div>

      <Separator />

      {/* ── Description ────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <SectionLabel>Overview</SectionLabel>
        <p className="text-sm text-foreground leading-relaxed">{option.description}</p>
      </div>

      <Separator />

      {/* ── Pros & Cons ────────────────────────────────────────────── */}
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SectionLabel>Advantages</SectionLabel>
          <ul className="space-y-2.5">
            {option.pros.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionLabel>Drawbacks</SectionLabel>
          <ul className="space-y-2.5">
            {option.cons.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[10px] font-bold">✕</span>
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Separator />

      {/* ── Technologies ───────────────────────────────────────────── */}
      {option.key_technologies?.length > 0 && (
        <>
          <div className="px-6 py-4">
            <SectionLabel>Technologies involved</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {option.key_technologies.map((t, i) => (
                <span key={i} className="text-xs font-medium bg-secondary text-secondary-foreground border border-border rounded-lg px-3 py-1">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* ── Footer: cost / time / best for ─────────────────────────── */}
      <div className="px-6 py-5 bg-muted/40 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <SectionLabel>Estimated cost</SectionLabel>
          <p className="text-sm font-semibold text-foreground">{option.estimated_cost}</p>
        </div>
        {option.estimated_time && (
          <div>
            <SectionLabel>Time to deploy</SectionLabel>
            <p className="text-sm font-semibold text-foreground">{option.estimated_time}</p>
          </div>
        )}
        <div className={option.estimated_time ? "md:col-span-2" : ""}>
          <SectionLabel>Best for</SectionLabel>
          <p className="text-sm text-foreground leading-relaxed">{option.best_for}</p>
        </div>
      </div>

    </div>
  );
}

export default function StrategyOptions({ options }: { options: StrategicOption[] }) {
  return (
    <div className="space-y-4">
      {options.map((opt, i) => (
        <OptionCard key={opt.id} option={opt} index={i} />
      ))}
    </div>
  );
}
