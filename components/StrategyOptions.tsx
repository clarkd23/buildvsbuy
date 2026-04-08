import { StrategicOption, OptionType } from "@/types/analysis";

const typeConfig: Record<OptionType, { bg: string; border: string; badge: string; text: string }> = {
  "Buy":                { bg: "bg-blue-50",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",   text: "text-blue-700" },
  "Build":              { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", text: "text-purple-700" },
  "Build + Components": { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 text-violet-700", text: "text-violet-700" },
  "Hybrid":             { bg: "bg-amber-50",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",  text: "text-amber-700" },
};

const riskColors = {
  Low: "text-green-600 bg-green-50",
  Medium: "text-yellow-600 bg-yellow-50",
  High: "text-red-600 bg-red-50",
};

const complexityColors = {
  Low: "text-green-600 bg-green-50",
  Medium: "text-yellow-600 bg-yellow-50",
  High: "text-red-600 bg-red-50",
};

function OptionCard({ option }: { option: StrategicOption }) {
  const config = typeConfig[option.type] ?? typeConfig["Hybrid"];

  return (
    <div className={`rounded-2xl border-2 ${config.border} overflow-hidden flex flex-col`}>
      {/* Header */}
      <div className={`${config.bg} px-5 py-4`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className={`font-bold text-xl ${config.text} leading-tight`}>{option.title}</h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${config.badge}`}>
            {option.type}
          </span>
        </div>
        <p className="text-sm text-gray-600">{option.tagline}</p>
      </div>

      {/* Body */}
      <div className="bg-white px-5 py-4 flex flex-col flex-1 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>

        {/* Pros / Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1.5">Pros</p>
            <ul className="space-y-1">
              {option.pros.map((p, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-gray-600">
                  <span className="text-green-500 mt-0.5 shrink-0">+</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1.5">Cons</p>
            <ul className="space-y-1">
              {option.cons.map((c, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-gray-600">
                  <span className="text-red-400 mt-0.5 shrink-0">−</span>{c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Key technologies */}
        {option.key_technologies?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Technologies involved</p>
            <div className="flex flex-wrap gap-1.5">
              {option.key_technologies.map((t, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Best for */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Best for</p>
          <p className="text-xs text-gray-700">{option.best_for}</p>
        </div>

        {/* Metrics row */}
        <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3 mt-auto">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Cost</p>
            <p className="text-sm font-semibold text-gray-700">{option.estimated_cost}</p>
          </div>
          {option.estimated_time && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Time to deploy</p>
              <p className="text-sm font-semibold text-gray-700">{option.estimated_time}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 mb-1">Risk</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskColors[option.risk_level]}`}>
              {option.risk_level}
            </span>
          </div>
          {option.complexity && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Complexity</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${complexityColors[option.complexity]}`}>
                {option.complexity}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StrategyOptions({ options }: { options: StrategicOption[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Strategic Options
      </h2>
      <div className={`grid gap-4 ${
        options.length === 2 ? "grid-cols-1 md:grid-cols-2" :
        options.length >= 3 ? "grid-cols-1 md:grid-cols-3" :
        "grid-cols-1"
      }`}>
        {options.map((opt) => (
          <OptionCard key={opt.id} option={opt} />
        ))}
      </div>
    </div>
  );
}
