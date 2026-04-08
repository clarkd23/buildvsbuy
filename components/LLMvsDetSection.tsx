import { LLMvsDetItem } from "@/types/analysis";

const approachConfig = {
  "LLM-first": { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  "Deterministic": { bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  "Hybrid": { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
};

const evalComplexityColors = {
  Simple: "text-green-600 bg-green-50",
  Moderate: "text-yellow-600 bg-yellow-50",
  Complex: "text-red-600 bg-red-50",
};

export default function LLMvsDetSection({ items }: { items: LLMvsDetItem[] }) {
  const llmCount = items.filter(i => i.approach !== "Deterministic").length;
  const needEvalCount = items.filter(i => i.needs_evals).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">LLM vs Deterministic — By Feature</h2>
          <p className="text-xs text-gray-400 mt-0.5">Which parts of the build should use AI inference vs. traditional code, and where evals are required.</p>
        </div>
        <div className="flex gap-2 text-xs shrink-0">
          <span className="bg-purple-50 text-purple-600 border border-purple-200 rounded-full px-3 py-1">
            {llmCount} LLM-powered
          </span>
          <span className="bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-3 py-1">
            {needEvalCount} need evals
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const config = approachConfig[item.approach] ?? approachConfig["Hybrid"];
          return (
            <div key={i} className={`rounded-xl border ${config.border} overflow-hidden`}>
              {/* Row header */}
              <div className={`${config.bg} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                  <span className="font-semibold text-gray-800 text-sm">{item.component}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.needs_evals && (
                    <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-medium">
                      Evals required
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                    {item.approach}
                  </span>
                </div>
              </div>

              {/* Detail */}
              <div className="bg-white px-4 py-3 space-y-3">
                <p className="text-sm text-gray-600">{item.rationale}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {item.llm_use_cases?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-1">Use LLM for</p>
                      <ul className="space-y-0.5">
                        {item.llm_use_cases.map((u, j) => (
                          <li key={j} className="text-xs text-gray-600 flex gap-1">
                            <span className="text-purple-400 mt-0.5">▸</span>{u}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.deterministic_use_cases?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Use deterministic code for</p>
                      <ul className="space-y-0.5">
                        {item.deterministic_use_cases.map((u, j) => (
                          <li key={j} className="text-xs text-gray-600 flex gap-1">
                            <span className="text-gray-400 mt-0.5">▸</span>{u}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {item.needs_evals && (
                  <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Eval Strategy</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${evalComplexityColors[item.eval_complexity]}`}>
                        {item.eval_complexity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">{item.eval_approach}</p>
                    <div className="bg-white border border-orange-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Example eval</p>
                      <p className="text-xs text-gray-700 font-mono leading-relaxed">{item.example_eval}</p>
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
