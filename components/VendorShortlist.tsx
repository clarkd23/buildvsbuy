import { VendorShortlistItem } from "@/types/analysis";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 7 ? "bg-emerald-100 text-emerald-700" :
    score >= 4 ? "bg-amber-100 text-amber-700" :
                 "bg-red-100 text-red-600";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {score}/10
    </span>
  );
}

export default function VendorShortlist({ vendors }: { vendors: VendorShortlistItem[] }) {
  const sorted = [...vendors].sort((a, b) => b.fit_score - a.fit_score);

  return (
    <div className="divide-y divide-border">
      {sorted.map((v, i) => (
        <div key={i} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
          {/* Score */}
          <div className="shrink-0 pt-0.5">
            <ScoreBadge score={v.fit_score} />
          </div>

          {/* Name + verdict */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground hover:underline underline-offset-2"
              >
                {v.name}
              </a>
              {v.researched && (
                <span className="text-[10px] font-medium bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full border border-border">
                  Deep researched
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{v.verdict}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
