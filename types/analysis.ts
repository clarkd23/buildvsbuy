// ─── Discovery ────────────────────────────────────────────────────────────────

export interface DiscoveryQuestion {
  id: number;
  question: string;
  hint: string;
  category: string;
  quick_options: string[];
}

export interface DiscoveryAnswer {
  question: string;
  answer: string;
}

// ─── Shared enums ─────────────────────────────────────────────────────────────

export type Complexity = "Low" | "Medium" | "High";
export type Effort = "Low" | "Medium" | "High" | "Very High";
export type RiskLevel = "Low" | "Medium" | "High";
export type AIResolveVerdict = "AI solves this" | "Partial AI help" | "Requires human expertise";
export type LLMApproach = "LLM-first" | "Deterministic" | "Hybrid";
export type EvalComplexity = "Simple" | "Moderate" | "Complex";
export type OptionType = "Buy" | "Build" | "Build + Components" | "Hybrid";

// ─── Strategic options (replaces build_case / buy_case) ──────────────────────

export interface StrategicOption {
  id: number;
  title: string;          // e.g. "Buy Intercom", "Build with ElevenLabs + Deepgram", "Zendesk + Custom AI Layer"
  type: OptionType;
  tagline: string;        // one punchy sentence
  description: string;   // 2-3 sentence explanation of what this path looks like in practice
  pros: string[];
  cons: string[];
  estimated_cost: string;
  estimated_time?: string;  // only relevant for build options
  best_for: string;         // who / when this option wins
  key_technologies: string[]; // specific vendors, APIs, or frameworks involved
  risk_level: RiskLevel;
  complexity?: Complexity;    // only relevant for build options
}

// ─── Vendor (researched from Firecrawl) ──────────────────────────────────────

export interface Vendor {
  name: string;
  url: string;
  pricing_info: string;
  fit_score: number;
  pros: string[];
  cons: string[];
  notable_features: string[];
  researched: boolean; // true = site was scraped; false = found in search only
  reddit_pros?: string[];
  reddit_cons?: string[];
}

// ─── Vendor shortlist (all vendors evaluated, not just top picks) ─────────────

export interface VendorShortlistItem {
  name: string;
  url: string;
  fit_score: number;       // 1–10
  verdict: string;         // one sentence: why included or ruled out
  researched: boolean;
}

// ─── Feasibility matrix ───────────────────────────────────────────────────────

export interface FeasibilityItem {
  feature: string;
  feasibility_score: number;
  component_feasibility_score: number;
  effort: Effort;
  risk: RiskLevel;
  notes: string;
}

// ─── Component recommendation ─────────────────────────────────────────────────

export interface ComponentRecommendation {
  name: string;
  url: string;
  category: string;
  what_it_solves: string;
  pricing_info: string;
  approximate_monthly_cost: string;
  feasibility_lift: number;
  integration_effort: Effort;
  key_limitations: string[];
}

// ─── Build challenge deep dive ────────────────────────────────────────────────

export interface BuildChallenge {
  feature: string;
  feasibility_score: number;
  why_hard: string;
  specific_obstacles: string[];
  what_ai_can_do: string;
  what_ai_cannot_do: string;
  ai_verdict: AIResolveVerdict;
  human_skills_required: string[];
  components: ComponentRecommendation[];
  with_components_feasibility: number;
  with_components_notes: string;
}

// ─── LLM vs deterministic breakdown ──────────────────────────────────────────

export interface LLMvsDetItem {
  component: string;
  approach: LLMApproach;
  rationale: string;
  llm_use_cases: string[];
  deterministic_use_cases: string[];
  needs_evals: boolean;
  eval_approach: string;
  eval_complexity: EvalComplexity;
  example_eval: string;
}

// ─── Persona views ────────────────────────────────────────────────────────────

export type Persona = "exec" | "product" | "engineering";

export interface PersonaView {
  persona: Persona;
  headline: string;
  summary: string;
  key_points: string[];
  recommendation: string;
  watch_out: string[];
}

// ─── Next steps ───────────────────────────────────────────────────────────────

export type NextStepPriority = "Do this week" | "Do this month" | "Consider later";

export interface NextStep {
  action: string;
  rationale: string;
  priority: NextStepPriority;
}

// ─── Full analysis result ─────────────────────────────────────────────────────

export interface AnalysisResult {
  options: StrategicOption[];           // 2-3 dynamic paths, AI-named
  top_vendors: Vendor[];
  build_feasibility_breakdown: FeasibilityItem[];
  top_build_challenges: BuildChallenge[];
  llm_vs_deterministic: LLMvsDetItem[];
  context_summary: string;
  vendor_shortlist: VendorShortlistItem[];
  next_steps: NextStep[];
  persona_views: PersonaView[];
}

// ─── Streaming ────────────────────────────────────────────────────────────────

export type StreamEventType =
  | "status"
  | "vendors_found"
  | "scraping_complete"
  | "analysis_complete"
  | "llm_analysis"
  | "result"
  | "challenges_loading"
  | "challenge_result"
  | "next_steps"
  | "persona_view"
  | "vendor_reddit"
  | "share_id"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  message?: string;
  vendors?: string[];
  data?: AnalysisResult;
  challenges_count?: number;
  challenge_result?: BuildChallenge;
  next_steps?: NextStep[];
  persona_view?: PersonaView;
  vendor_reddit?: { vendor_name: string; pros: string[]; cons: string[] };
  share_id?: string;
  error?: string;
}
