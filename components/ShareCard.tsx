import { AnalysisResult, OptionType } from "@/types/analysis";

const optionColors: Record<OptionType, { bg: string; label: string }> = {
  "Buy":              { bg: "#1d4ed8", label: "BUY" },
  "Build":            { bg: "#7c3aed", label: "BUILD" },
  "Build + Components": { bg: "#6d28d9", label: "BUILD +" },
  "Hybrid":           { bg: "#b45309", label: "HYBRID" },
};

interface Props {
  result: AnalysisResult;
  problem: string;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export default function ShareCard({ result, problem, cardRef }: Props) {
  const topStep = result.next_steps?.find(s => s.priority === "Do this week");
  const truncatedProblem = problem.length > 120 ? problem.slice(0, 117) + "..." : problem;

  return (
    <div
      ref={cardRef}
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: "1200px",
        height: "630px",
        background: "#0a0a0a",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Gradient accent bar */}
      <div style={{
        height: "6px",
        background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #ec4899)",
        flexShrink: 0,
      }} />

      <div style={{ padding: "52px 64px", display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "36px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em", color: "#6366f1", textTransform: "uppercase", marginBottom: "8px" }}>
              Build vs Buy Analysis
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", lineHeight: 1.3, maxWidth: "900px" }}>
              {truncatedProblem}
            </div>
          </div>
        </div>

        {/* Options */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "36px" }}>
          {result.options?.slice(0, 3).map((option, i) => {
            const cfg = optionColors[option.type] ?? { bg: "#374151", label: option.type };
            return (
              <div key={i} style={{
                flex: 1,
                background: cfg.bg + "22",
                border: `1px solid ${cfg.bg}66`,
                borderRadius: "12px",
                padding: "20px 22px",
              }}>
                <div style={{
                  display: "inline-block",
                  background: cfg.bg,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  marginBottom: "10px",
                }}>
                  {cfg.label}
                </div>
                <div style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff", marginBottom: "6px", lineHeight: 1.2 }}>
                  {option.title}
                </div>
                <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                  {option.estimated_cost}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next step */}
        {topStep && (
          <div style={{
            background: "#ffffff0d",
            border: "1px solid #ffffff18",
            borderRadius: "10px",
            padding: "16px 22px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: "#22c55e", flexShrink: 0,
            }} />
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e", letterSpacing: "0.1em", marginRight: "10px" }}>
                DO THIS WEEK
              </span>
              <span style={{ fontSize: "14px", color: "#e5e7eb" }}>{topStep.action}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: "#4b5563" }}>
            AI-powered build vs buy research
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.05em" }}>
            buildvsbuy.ai
          </div>
        </div>
      </div>
    </div>
  );
}
