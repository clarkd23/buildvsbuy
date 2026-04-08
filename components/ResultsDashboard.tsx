import { AnalysisResult, Persona } from "@/types/analysis";
import VendorCard from "./VendorCard";
import VendorShortlist from "./VendorShortlist";
import StrategyOptions from "./StrategyOptions";
import ChallengeDeepDive from "./ChallengeDeepDive";
import ExpandableSection from "./ExpandableSection";
import NextStepsSection from "./NextStepsSection";
import PersonaViewCard from "./PersonaView";

const PERSONA_TABS: { id: Persona; label: string }[] = [
  { id: "exec",        label: "Executive" },
  { id: "product",     label: "Product" },
  { id: "engineering", label: "Engineering" },
];

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

function vendorSummary(vendors: AnalysisResult["top_vendors"]) {
  if (!vendors?.length) return "";
  const researched = vendors.filter(v => v.researched).length;
  return `${vendors.length} vendors · ${researched} deep researched`;
}

export default function ResultsDashboard({
  result,
  selectedPersona,
  onPersonaChange,
  challengesExpected = 0,
}: {
  result: AnalysisResult;
  selectedPersona: Persona;
  onPersonaChange: (p: Persona) => void;
  challengesExpected?: number;
}) {
  const activeView = result.persona_views?.find(v => v.persona === selectedPersona);

  return (
    <div className="space-y-3 animate-fadeIn">

      {/* Persona tab bar + active view */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex border-b border-gray-100">
          {PERSONA_TABS.map(tab => {
            const active = selectedPersona === tab.id;
            const loaded = result.persona_views?.some(v => v.persona === tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => onPersonaChange(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                  active
                    ? "text-gray-900 bg-gray-50"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                {!loaded && (
                  <span className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                )}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
            );
          })}
        </div>
        <PersonaViewCard persona={selectedPersona} view={activeView} />
      </div>

      {/* Context */}
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

      {/* Build challenge deep dives — loads after main result */}
      {(challengesExpected > 0 || result.top_build_challenges?.length > 0) && (
        <ExpandableSection
          title="Top Build Challenges"
          summary={
            result.top_build_challenges?.length > 0
              ? challengeSummary(result.top_build_challenges)
              : "Analyzing…"
          }
          defaultOpen={false}
          badge="Deep dive"
          badgeColor="bg-orange-50 text-orange-600"
        >
          {result.top_build_challenges?.length > 0 ? (
            <ChallengeDeepDive challenges={result.top_build_challenges} />
          ) : (
            <div className="space-y-3 animate-pulse py-2">
              {Array.from({ length: challengesExpected || 1 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </div>
              ))}
            </div>
          )}
        </ExpandableSection>
      )}

{/* Next steps */}
      {result.next_steps?.length > 0 && (
        <ExpandableSection
          title="Recommended Next Steps"
          summary={`${result.next_steps.length} actions · ${result.next_steps.map(s => s.priority).join(" · ")}`}
          defaultOpen={true}
          badge="Action plan"
          badgeColor="bg-green-50 text-green-600"
        >
          <NextStepsSection steps={result.next_steps} />
        </ExpandableSection>
      )}

      {/* Vendor fit summary — all vendors scored */}
      {result.vendor_shortlist?.length > 0 && (
        <ExpandableSection
          title="All Vendors Considered"
          summary={`${result.vendor_shortlist.length} vendors scored · ${result.vendor_shortlist.filter(v => v.fit_score >= 7).length} strong fit · ${result.vendor_shortlist.filter(v => v.fit_score < 4).length} ruled out`}
          defaultOpen={false}
          badge="Fit scores"
          badgeColor="bg-sky-50 text-sky-600"
        >
          <VendorShortlist vendors={result.vendor_shortlist} />
        </ExpandableSection>
      )}

      {/* Vendors — deep-researched detail cards */}
      {result.top_vendors?.length > 0 && (
        <ExpandableSection
          title="Top Vendor Deep Dives"
          summary={vendorSummary(result.top_vendors)}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.top_vendors.map((vendor, i) => (
              <VendorCard key={i} vendor={vendor} context={result.context_summary} />
            ))}
          </div>
        </ExpandableSection>
      )}
    </div>
  );
}
