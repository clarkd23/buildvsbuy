import { FeasibilityItem } from "@/types/analysis";

const effortColors: Record<string, string> = {
  Low: "text-green-700 bg-green-50",
  Medium: "text-yellow-700 bg-yellow-50",
  High: "text-orange-700 bg-orange-50",
  "Very High": "text-red-700 bg-red-50",
};

const riskColors: Record<string, string> = {
  Low: "text-green-700 bg-green-50",
  Medium: "text-yellow-700 bg-yellow-50",
  High: "text-red-700 bg-red-50",
};

function ScoreBar({ score, dim = false }: { score: number; dim?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-sm ${
            i <= score
              ? dim
                ? "bg-gray-300"
                : score >= 4 ? "bg-green-500" : score >= 3 ? "bg-yellow-500" : "bg-red-400"
              : "bg-gray-100"
          }`} />
        ))}
      </div>
      <span className={`text-xs font-semibold ${dim ? "text-gray-400" : "text-gray-600"}`}>{score}</span>
    </div>
  );
}

export default function FeasibilityMatrix({ items }: { items: FeasibilityItem[] }) {
  const avgScratch = items.reduce((s, i) => s + i.feasibility_score, 0) / items.length;
  const avgComponent = items.reduce((s, i) => s + (i.component_feasibility_score ?? i.feasibility_score), 0) / items.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">AI Build Feasibility Matrix</h2>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>Scratch avg: <strong className={avgScratch >= 4 ? "text-green-600" : avgScratch >= 3 ? "text-yellow-600" : "text-red-500"}>{avgScratch.toFixed(1)}/5</strong></span>
          <span>With components avg: <strong className={avgComponent >= 4 ? "text-green-600" : avgComponent >= 3 ? "text-yellow-600" : "text-red-500"}>{avgComponent.toFixed(1)}/5</strong></span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Feature / Task</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scratch</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">With Components</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Effort</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const compScore = item.component_feasibility_score ?? item.feasibility_score;
              const lifted = compScore > item.feasibility_score;
              return (
                <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.feature}</td>
                  <td className="px-4 py-3"><ScoreBar score={item.feasibility_score} dim={lifted} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ScoreBar score={compScore} />
                      {lifted && <span className="text-xs text-green-600 font-semibold">+{compScore - item.feasibility_score}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${effortColors[item.effort] ?? "bg-gray-100 text-gray-600"}`}>
                      {item.effort}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${riskColors[item.risk] ?? "bg-gray-100 text-gray-600"}`}>
                      {item.risk}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{item.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
