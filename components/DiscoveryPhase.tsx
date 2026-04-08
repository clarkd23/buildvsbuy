"use client";

import { DiscoveryQuestion } from "@/types/analysis";
import VendorPicker from "./VendorPicker";

const categoryColors: Record<string, string> = {
  Scale: "bg-blue-50 text-blue-600",
  Integrations: "bg-purple-50 text-purple-600",
  Team: "bg-green-50 text-green-600",
  Compliance: "bg-red-50 text-red-600",
  Budget: "bg-yellow-50 text-yellow-600",
  Differentiation: "bg-orange-50 text-orange-600",
  Users: "bg-teal-50 text-teal-600",
  Features: "bg-indigo-50 text-indigo-600",
  Risk: "bg-rose-50 text-rose-600",
  History: "bg-gray-100 text-gray-600",
};

interface Props {
  questions: DiscoveryQuestion[];
  answers: Record<number, string>;
  onAnswerChange: (id: number, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  customVendors: string[];
  onVendorsChange: (vendors: string[]) => void;
}

export default function DiscoveryPhase({ questions, answers, onAnswerChange, onSubmit, loading, customVendors, onVendorsChange }: Props) {
  const answeredCount = Object.values(answers).filter((a) => a.trim()).length;
  const required = Math.ceil(questions.length * 0.5);
  const canSubmit = answeredCount >= required;

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Discovery Questions</h2>
        <p className="text-gray-500 text-sm">
          Click a quick answer or type your own. At least {required} of {questions.length} required to continue.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{answeredCount} of {questions.length} answered</span>
          <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3 mb-8">
        {questions.map((q) => {
          const currentAnswer = answers[q.id] ?? "";
          const answered = !!currentAnswer.trim();

          return (
            <div
              key={q.id}
              className={`bg-white border rounded-xl p-4 transition-colors ${
                answered ? "border-gray-300" : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-gray-300 mt-0.5 w-4 shrink-0">{q.id}</span>
                <div className="flex-1 min-w-0">
                  {/* Question + category */}
                  <div className="flex items-start gap-2 mb-1.5">
                    <p className="font-medium text-gray-800 text-sm leading-snug">{q.question}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${categoryColors[q.category] ?? "bg-gray-100 text-gray-500"}`}>
                      {q.category}
                    </span>
                  </div>

                  {q.hint && (
                    <p className="text-xs text-gray-400 mb-2">{q.hint}</p>
                  )}

                  {/* Quick-select chips */}
                  {q.quick_options?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {q.quick_options.map((opt) => {
                        const selected = currentAnswer === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => onAnswerChange(q.id, selected ? "" : opt)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              selected
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Free-text input */}
                  <input
                    type="text"
                    value={q.quick_options?.includes(currentAnswer) ? "" : currentAnswer}
                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                    placeholder={answered && q.quick_options?.includes(currentAnswer) ? `"${currentAnswer}" selected` : "Or type a custom answer..."}
                    className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vendor picker */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
        <VendorPicker vendors={customVendors} onChange={onVendorsChange} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {canSubmit
            ? "Ready — more answers will sharpen the analysis."
            : `Answer ${required - answeredCount} more to continue.`}
        </p>
        <button
          onClick={onSubmit}
          disabled={!canSubmit || loading}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Starting analysis..." : "Start Research →"}
        </button>
      </div>
    </div>
  );
}
