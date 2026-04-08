import { AnalysisResult } from "@/types/analysis";
import VendorCard from "./VendorCard";
import StrategyOptions from "./StrategyOptions";
import ChallengeDeepDive from "./ChallengeDeepDive";
import LLMvsDetSection from "./LLMvsDetSection";
import ExpandableSection from "./ExpandableSection";

function challengeSummary(challenges: AnalysisResult["top_build_challenges"]) {
  if (!challenges?.length) return "";
  const solves = challenges.filter(c => c.ai_verdict === "AI solves this").length;
  const partial = challenges.filter(c => c.ai_verdict === "Partial AI help").length;
  const human = challenges.filter(c => c.ai_verdict === "Requires human expertise").length;
  const parts = [];
  if (solves) parts.push(`${solves} AI solves`);
  if (partial) parts.push(`${partial} partial`);
  if (human) parts.push(`${human} needs humans`);
  return `${challenges.length} challenges · ${parts.join(" · ")}`;
}

function llmSummary(items: AnalysisResult["llm_vs_deterministic"]) {
  if (!items?.length) return "";
  const llm = items.filter(i => i.approach !== "Deterministic").length;
  const evals = items.filter(i => i.needs_evals).length;
  return `${items.length} features · ${llm} LLM-powered · ${evals} need evals`;
}

function vendorSummary(vendors: AnalysisResult["top_vendors"]) {
  if (!vendors?.length) return "";
  const researched = vendors.filter(v => v.researched).length;
  return `${vendors.length} vendors · ${researched} deep researched`;
}

export default function ResultsDashboard({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Context — always visible, not expandable */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Analysis Context</p>
        <p className="text-gray-700 leading-relaxed text-sm">{result.context_summary}</p>
      </div>

      {/* Strategic options — open by default */}
      {result.options?.length > 0 && (
        <ExpandableSection
          title="Strategic Options"
          summary={`${result.options.length} paths identified · ${result.options.map(o => o.title).join(" · ")}`}
          defaultOpen={true}
          badge={`${result.options.length} options`}
          badgeColor="bg-blue-50 text-blue-600"
        >
          <StrategyOptions options={result.options} />
        </ExpandableSection>
      )}

{/* Build challenge deep dives */}
      {result.top_build_challenges?.length > 0 && (
        <ExpandableSection
          title="Top Build Challenges"
          summary={challengeSummary(result.top_build_challenges)}
          defaultOpen={false}
          badge="Deep dive"
          badgeColor="bg-orange-50 text-orange-600"
        >
          <ChallengeDeepDive challenges={result.top_build_challenges} />
        </ExpandableSection>
      )}

      {/* LLM vs deterministic */}
      {result.llm_vs_deterministic?.length > 0 && (
        <ExpandableSection
          title="LLM vs Deterministic"
          summary={llmSummary(result.llm_vs_deterministic)}
          defaultOpen={false}
          badge="Evals"
          badgeColor="bg-purple-50 text-purple-600"
        >
          <LLMvsDetSection items={result.llm_vs_deterministic} />
        </ExpandableSection>
      )}

      {/* Vendors */}
      {result.top_vendors?.length > 0 && (
        <ExpandableSection
          title="Vendors Researched"
          summary={vendorSummary(result.top_vendors)}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.top_vendors.map((vendor, i) => (
              <VendorCard key={i} vendor={vendor} />
            ))}
          </div>
        </ExpandableSection>
      )}
    </div>
  );
}
