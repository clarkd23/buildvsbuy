import { NextStep, NextStepPriority } from "@/types/analysis";

const priorityConfig: Record<NextStepPriority, { color: string; dot: string }> = {
  "Do this week":   { color: "bg-green-50 border-green-200 text-green-800",  dot: "bg-green-500" },
  "Do this month":  { color: "bg-blue-50 border-blue-200 text-blue-800",     dot: "bg-blue-500" },
  "Consider later": { color: "bg-gray-50 border-gray-200 text-gray-600",     dot: "bg-gray-400" },
};

export default function NextStepsSection({ steps }: { steps: NextStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const cfg = priorityConfig[step.priority] ?? priorityConfig["Consider later"];
        return (
          <div key={i} className={`border rounded-xl px-4 py-3.5 ${cfg.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <span className="text-xs font-semibold uppercase tracking-wide">{step.priority}</span>
            </div>
            <p className="font-medium text-sm mb-0.5">{step.action}</p>
            <p className="text-xs opacity-70">{step.rationale}</p>
          </div>
        );
      })}
    </div>
  );
}
