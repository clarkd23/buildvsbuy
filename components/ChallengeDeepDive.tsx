import { BuildChallenge, ComponentRecommendation } from "@/types/analysis";

const verdictConfig = {
  "AI solves this": { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700" },
  "Partial AI help": { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" },
  "Requires human expertise": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
};

function ScoreDots({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`w-3 h-3 rounded-sm ${
          i < score
            ? score >= 4 ? "bg-green-500" : score >= 3 ? "bg-yellow-500" : "bg-red-400"
            : "bg-gray-200"
        }`} />
      ))}
      <span className="text-xs text-gray-500 ml-1">{score}/{max}</span>
    </div>
  );
}

function ComponentCard({ component }: { component: ComponentRecommendation }) {
  const liftColor = component.feasibility_lift >= 2 ? "text-green-600" : "text-yellow-600";
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <a href={component.url} target="_blank" rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:underline text-sm">
            {component.name}
          </a>
          <span className="ml-2 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{component.category}</span>
        </div>
        <span className={`text-xs font-bold ${liftColor}`}>+{component.feasibility_lift} feasibility</span>
      </div>

      <p className="text-xs text-gray-600 mb-3">{component.what_it_solves}</p>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <p className="text-gray-400 uppercase tracking-wide mb-0.5">Pricing</p>
          <p className="text-gray-700 font-medium">{component.pricing_info}</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wide mb-0.5">Est. Monthly</p>
          <p className="text-gray-700 font-medium">{component.approximate_monthly_cost}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-400 uppercase tracking-wide mb-0.5">Integration Effort</p>
          <p className="text-gray-700 font-medium">{component.integration_effort}</p>
        </div>
      </div>

      {component.key_limitations?.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Still doesn&apos;t solve</p>
          <ul className="space-y-0.5">
            {component.key_limitations.map((l, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-1">
                <span className="text-orange-400">▸</span>{l}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ChallengeDeepDive({ challenges }: { challenges: BuildChallenge[] }) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Top Build Challenges — Deep Dive</h2>
        <p className="text-xs text-gray-400 mt-0.5">The hardest features to build, with component options that change the picture.</p>
      </div>

      <div className="space-y-4">
        {challenges.map((c, i) => {
          const config = verdictConfig[c.ai_verdict] ?? verdictConfig["Partial AI help"];
          return (
            <div key={i} className={`rounded-2xl border-2 ${config.border} overflow-hidden`}>
              {/* Header */}
              <div className={`${config.bg} px-5 py-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-gray-400 uppercase">Challenge {i + 1}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Scratch:</span>
                        <ScoreDots score={c.feasibility_score} />
                        {c.with_components_feasibility > c.feasibility_score && (
                          <>
                            <span className="text-gray-300">→</span>
                            <span>With components:</span>
                            <ScoreDots score={c.with_components_feasibility} />
                          </>
                        )}
                      </div>
                    </div>
                    <h3 className={`font-bold text-lg ${config.text}`}>{c.feature}</h3>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${config.badge}`}>
                    {c.ai_verdict}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="bg-white px-5 py-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Why this is hard</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.why_hard}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Specific blockers</p>
                  <div className="flex flex-wrap gap-2">
                    {c.specific_obstacles.map((o, j) => (
                      <span key={j} className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">{o}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">What Claude Code can do</p>
                    <p className="text-sm text-gray-700">{c.what_ai_can_do}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">What AI cannot resolve</p>
                    <p className="text-sm text-gray-700">{c.what_ai_cannot_do}</p>
                  </div>
                </div>

                {/* Component recommendations */}
                {c.components?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Off-the-shelf components that help
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {c.components.map((comp, j) => (
                        <ComponentCard key={j} component={comp} />
                      ))}
                    </div>
                    {c.with_components_notes && (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">With components — revised picture</p>
                        <p className="text-sm text-gray-700">{c.with_components_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {c.human_skills_required?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Human expertise still needed</p>
                    <div className="flex flex-wrap gap-2">
                      {c.human_skills_required.map((s, j) => (
                        <span key={j} className="text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-3 py-1">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
