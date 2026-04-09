import Anthropic from "@anthropic-ai/sdk";
import { AnalysisResult, BuildChallenge, DiscoveryAnswer, DiscoveryQuestion, FeasibilityItem, LLMvsDetItem, Persona, PersonaView, VendorShortlistItem } from "@/types/analysis";

const getClient = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Extract the first complete JSON object or array using bracket balancing.
// Handles trailing text, leading prose, and markdown code fences.
function parseJSON<T>(text: string): T {
  // Strip markdown fences
  const stripped = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  // Try direct parse first (clean response)
  try { return JSON.parse(stripped) as T; } catch { /* fall through */ }

  // Walk the string to find the first balanced { } or [ ]
  for (let start = 0; start < stripped.length; start++) {
    const opening = stripped[start];
    if (opening !== "{" && opening !== "[") continue;
    const closing = opening === "[" ? "]" : "}";
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < stripped.length; i++) {
      const ch = stripped[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === opening) depth++;
      if (ch === closing && --depth === 0) {
        try { return JSON.parse(stripped.slice(start, i + 1)) as T; }
        catch { break; }
      }
    }
  }

  throw new Error(`Could not parse JSON from Claude response: ${stripped.slice(0, 300)}`);
}

// ─── Step 0: Discovery questions ─────────────────────────────────────────────

export async function generateDiscoveryQuestions(
  problemStatement: string
): Promise<DiscoveryQuestion[]> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: `You are a senior software consultant running a discovery session before a build-vs-buy analysis. Your job is to ask the exact questions that would most change the recommendation.

Assess the complexity of the problem and generate between 1 and 10 questions accordingly:
- Simple, well-defined problems: 2–3 questions
- Moderate complexity: 4–6 questions
- Complex, multi-system or enterprise problems: 7–10 questions

Cover the dimensions that most affect build vs buy decisions:
- Scale & volume (users, requests, data)
- Existing tech stack and integrations required
- Team's engineering capability and capacity
- Compliance, regulatory, or data residency requirements
- Budget range and timeline constraints
- Whether the workflow is differentiating or commodity
- Internal users vs external customers
- Must-have vs nice-to-have features
- Tolerance for vendor lock-in
- Whether this has been attempted before

Rules:
- Questions must be SPECIFIC to the problem domain — not generic boilerplate
- Each question should change what you'd recommend if answered differently
- Hint should tell the user WHY this question matters and what to include
- Category should be one of: Scale, Integrations, Team, Compliance, Budget, Differentiation, Users, Features, Risk, History

For each question also generate 3–5 quick_options: short clickable answers of 2–5 words each that cover the most common responses. These let users answer with one click instead of typing. Make them specific and distinct — not generic placeholders.

Respond with ONLY a valid JSON array:
[
  {
    "id": 1,
    "question": "Specific, targeted question about this problem",
    "hint": "Short guidance: e.g. 'Include peak concurrent users — this determines whether off-the-shelf tiers will be cost-effective'",
    "category": "Scale",
    "quick_options": ["Under 1,000 users", "1,000–10,000 users", "10,000–100,000 users", "100,000+ users"]
  }
]`,
    messages: [{
      role: "user",
      content: `Problem statement: "${problemStatement}"\n\nGenerate discovery questions for this specific problem.`,
    }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  try {
    return parseJSON<DiscoveryQuestion[]>(block.text);
  } catch (err) {
    console.error("[generateDiscoveryQuestions] parse failed. stop_reason:", response.stop_reason, "raw tail:", block.text.slice(-300));
    throw err;
  }
}

// ─── Build enriched context from problem + answers ────────────────────────────

export function buildEnrichedContext(
  problemStatement: string,
  answers: DiscoveryAnswer[]
): string {
  const answered = answers.filter((a) => a.answer.trim());
  if (answered.length === 0) return problemStatement;

  const qaBlock = answered
    .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");

  return `${problemStatement}\n\n--- Discovery answers ---\n${qaBlock}`;
}

// ─── Step 1: Generate optimized vendor search query ──────────────────────────

export async function generateSearchQuery(problemStatement: string): Promise<string> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Generate a concise search query (max 8 words) to find the top SaaS vendors and tools that solve this problem: "${problemStatement}". Do not include any year or date in the query. Return only the search query, nothing else.`,
    }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : problemStatement;
}

// ─── Step 2: Strategic options analysis ──────────────────────────────────────

export async function analyzeVendors(
  problemStatement: string,
  vendorData: { name: string; url: string; content: string }[]
): Promise<Omit<AnalysisResult, "top_build_challenges" | "llm_vs_deterministic" | "next_steps" | "persona_views">> {
  const vendorContext = vendorData
    .map((v, i) => `--- VENDOR ${i + 1}: ${v.name} (${v.url}) ---\n${v.content.slice(0, 2500)}\n`)
    .join("\n");

  const system = `You are a neutral software procurement analyst. Based on the problem and vendor research, generate 2–3 realistic strategic options a team could actually pursue. Do NOT force a Build vs Buy binary — the options should reflect what genuinely makes sense for this problem.

## Option types available
- "Buy" — purchase a complete SaaS solution
- "Build" — build from scratch with AI-assisted development
- "Build + Components" — assemble using purpose-built APIs (e.g. ElevenLabs for voice, Deepgram for ASR, Stripe for payments, Twilio for comms)
- "Hybrid" — buy a vendor for the commodity core, build custom logic on top

## AI-Assisted Development Calibration — CRITICAL
All build time estimates MUST assume modern AI-assisted development (Claude Code, Cursor, GitHub Copilot). Traditional estimates are 3–5x too slow. Apply these calibrated multipliers:

| Traditional estimate | AI-assisted estimate |
|---|---|
| 3–6 months | 3–6 weeks |
| 1–3 months | 1–3 weeks |
| 2–4 weeks | 3–7 days |
| 1 week | 1–2 days |

- Always state estimates as "with AI-assisted development (Claude Code / Cursor)" in the output string
- A solo dev or small team using Claude Code can ship working MVPs in days, not months
- AI handles boilerplate, API integrations, tests, and debugging — humans focus on architecture decisions and business logic
- Do NOT regress to traditional waterfall estimates; those are not calibrated for 2025+ tooling

## Rules
- Name each option descriptively, not generically. Use real product names. e.g. "Buy Intercom", "Build with ElevenLabs + Deepgram", "Zendesk + Custom AI Routing Layer"
- Only include options that are genuinely viable for this problem
- Be equally rigorous across all options — do not inflate or deflate any path
- Use real pricing from vendor research where available
- Decompose into 3–6 feature tasks for the feasibility matrix, scoring each on scratch AND component build

## AI Build Feasibility Reference (score 1–5)
| Feature Type | Scratch | With Components |
|---|---|---|
| Auto-generate responses / templates | 5 | 5 |
| Knowledge base ingestion & summarization | 4 | 5 |
| Single-step workflow automation | 4 | 4 |
| Multi-step resolution with CRM/API integration | 3 | 4 |
| Voice agent with multi-turn reasoning | 3 | 4 |
| Custom analytics & reporting | 2 | 3 |
| End-to-end enterprise AI agent (omnichannel, SLAs) | 1 | 2 |
| Proprietary business logic / regulated workflows | 1 | 2 |

Respond with ONLY valid JSON:
{
  "options": [
    {
      "id": 1,
      "title": "Buy Intercom",
      "type": "Buy",
      "tagline": "One punchy sentence describing this path",
      "description": "2-3 sentences on what this path looks like in practice — what you buy, what you configure, what you don't get",
      "pros": ["specific pro 1", "specific pro 2"],
      "cons": ["specific con 1", "specific con 2"],
      "estimated_cost": "e.g. $800–$2,000/mo or $25,000 one-time",
      "estimated_time": "e.g. '3–5 days with AI-assisted development (Claude Code / Cursor)' — omit for pure Buy",
      "best_for": "Who or what situation this option wins for",
      "key_technologies": ["Intercom", "Salesforce integration"],
      "risk_level": "Low|Medium|High",
      "complexity": "Low|Medium|High"
    }
  ],
  "top_vendors": [
    {
      "name": "...", "url": "https://...", "pricing_info": "...",
      "fit_score": 7, "pros": ["..."], "cons": ["..."], "notable_features": ["..."]
    }
  ],
  "build_feasibility_breakdown": [
    {
      "feature": "...",
      "feasibility_score": 3,
      "component_feasibility_score": 4,
      "effort": "Low|Medium|High|Very High",
      "risk": "Low|Medium|High",
      "notes": "One sentence"
    }
  ],
  "vendor_shortlist": [
    {
      "name": "HubSpot",
      "url": "https://hubspot.com",
      "fit_score": 8,
      "verdict": "Strong fit — covers core requirements with native integrations at the right price point",
      "researched": true
    },
    {
      "name": "Salesforce",
      "url": "https://salesforce.com",
      "fit_score": 3,
      "verdict": "Ruled out — significantly over-engineered and over-priced for this team size and timeline",
      "researched": true
    }
  ],
  "context_summary": "One paragraph framing the decision space and what makes this problem interesting."
}

Rate EVERY vendor you were given in vendor_shortlist — include all of them, not just the top picks. For unresearched vendors (no scraped content), give your best assessment based on what you know about the product.`;

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8096,
    system,
    messages: [{
      role: "user",
      content: `Problem: "${problemStatement}"\n\nVendor research:\n\n${vendorContext}\n\nProvide balanced Build vs Buy analysis as JSON.`,
    }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response from Claude");
  return parseJSON(block.text);
}

// ─── Step 3a: Identify components for a challenge (returns URLs to scrape) ────

export async function identifyComponents(
  problemStatement: string,
  item: FeasibilityItem
): Promise<{ component_name: string; url: string; category: string; why_relevant: string }[]> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `We are building: "${problemStatement}"
The hardest feature to build is: "${item.feature}" (feasibility ${item.feasibility_score}/5)

List the top 2 off-the-shelf component APIs or platforms a developer would use to accelerate building this specific feature. These are NOT full SaaS solutions — they are building blocks (e.g. ElevenLabs for voice, Deepgram for ASR, Twilio for comms, Stripe for payments).

Return ONLY valid JSON array:
[
  {
    "component_name": "ElevenLabs",
    "url": "https://elevenlabs.io",
    "category": "Voice AI Platform",
    "why_relevant": "One sentence on what specifically it provides for this feature"
  }
]`,
    }],
  });

  const block = response.content[0];
  if (block.type !== "text") return [];
  try { return parseJSON(block.text); } catch { return []; }
}

// ─── Step 3b: Deep dive with scraped component data ───────────────────────────

export async function analyzeBuildChallenge(
  problemStatement: string,
  item: FeasibilityItem,
  componentData: { name: string; url: string; category: string; why_relevant: string; scraped_content: string }[]
): Promise<BuildChallenge> {
  const componentContext = componentData.length > 0
    ? componentData.map(c =>
        `--- COMPONENT: ${c.name} (${c.url}) — ${c.category} ---\nWhy relevant: ${c.why_relevant}\n${c.scraped_content.slice(0, 2000)}\n`
      ).join("\n")
    : "No component data available.";

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You are a senior software engineer and AI tooling expert. Give an honest, technically grounded assessment of a build challenge — including exactly which off-the-shelf components change the picture and how.

## AI-Assisted Development Calibration — CRITICAL
All effort and time estimates MUST assume modern AI-assisted development (Claude Code, Cursor, GitHub Copilot). Traditional estimates are 3–5x too slow for 2025:

| Traditional | AI-assisted reality |
|---|---|
| 3–6 months | 3–6 weeks |
| 1–3 months | 1–3 weeks |
| 2–4 weeks | 3–7 days |
| 1 week | 1–2 days |

- A developer using Claude Code can write API integrations, boilerplate, and tests in hours, not days
- integration_effort of "Low" = measurable hours; "Medium" = 1–3 days; "High" = 1–2 weeks; "Very High" = 3+ weeks
- In with_components_notes, give concrete AI-assisted timeline estimates (e.g. "2–3 days to integrate with Claude Code")
- Do NOT regress to pre-AI estimates; the falsely pessimistic estimate is now the traditional one

Be specific. Be honest about what AI genuinely cannot do (architecture decisions, domain expertise, novel business logic). Use the scraped component data for real pricing and capability details.

Respond with ONLY valid JSON:
{
  "feature": "feature name",
  "feasibility_score": 3,
  "why_hard": "Root technical reason — 2-3 sentences",
  "specific_obstacles": ["blocker 1", "blocker 2", "blocker 3"],
  "what_ai_can_do": "Specific honest statement of where Claude Code / AI tools genuinely help",
  "what_ai_cannot_do": "The gap AI tools cannot close",
  "ai_verdict": "AI solves this|Partial AI help|Requires human expertise",
  "human_skills_required": ["skill 1", "skill 2"],
  "components": [
    {
      "name": "ElevenLabs",
      "url": "https://elevenlabs.io",
      "category": "Voice AI Platform",
      "what_it_solves": "Specific thing it resolves for this feature",
      "pricing_info": "Exact pricing from scraped data, or 'See website' if unclear",
      "approximate_monthly_cost": "e.g. $99–$330/mo depending on usage",
      "feasibility_lift": 1,
      "integration_effort": "Low|Medium|High|Very High",
      "key_limitations": ["what it still doesn't solve"]
    }
  ],
  "with_components_feasibility": 4,
  "with_components_notes": "One paragraph: how using these components changes the build picture, effort, and risk"
}`,
    messages: [{
      role: "user",
      content: `Overall problem: "${problemStatement}"
Feature to analyze: "${item.feature}" (current feasibility: ${item.feasibility_score}/5)
Notes: ${item.notes}

Available component data:
${componentContext}

Provide the full deep-dive analysis with component recommendations.`,
    }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response");
  try { return parseJSON(block.text); }
  catch { throw new Error(`Failed to parse challenge analysis for: ${item.feature}`); }
}

// ─── Step 4a: Next steps ─────────────────────────────────────────────────────

export async function generateNextSteps(
  problemStatement: string,
  contextSummary: string,
  optionTitles: string[]
): Promise<import("@/types/analysis").NextStep[]> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Problem: "${problemStatement}"
Context: ${contextSummary}
Options identified: ${optionTitles.join(", ")}

Generate exactly 3 specific next steps to move this decision forward. One per priority level.

Return ONLY valid JSON array:
[
  { "action": "Specific action — use real names/tools", "rationale": "One sentence why", "priority": "Do this week" },
  { "action": "...", "rationale": "...", "priority": "Do this month" },
  { "action": "...", "rationale": "...", "priority": "Consider later" }
]`,
    }],
  });
  const block = response.content[0];
  if (block.type !== "text") return [];
  try { return parseJSON(block.text); } catch (err) {
    console.error("[generateNextSteps] parse failed:", err, "raw:", block.text.slice(0, 200));
    return [];
  }
}

// ─── Step 4b: LLM vs deterministic breakdown ──────────────────────────────────

export async function analyzeLLMvsDeterministic(
  problemStatement: string,
  features: string[]
): Promise<LLMvsDetItem[]> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You are an AI systems architect. For each feature of a software problem, determine whether it should be built with LLM inference, deterministic logic, or a hybrid — and what the eval strategy should be.

Key principles:
- Use LLM for: generation, reasoning, intent detection, summarization, flexible NLU, multi-turn conversation
- Use Deterministic for: routing rules, data validation, CRUD, calculations, structured workflows, anything requiring 100% accuracy
- Use Hybrid for: LLM interprets/extracts, deterministic code acts on the result
- Evals are required wherever LLM output affects downstream logic or user experience

Respond with ONLY a valid JSON array:
[
  {
    "component": "feature name",
    "approach": "LLM-first|Deterministic|Hybrid",
    "rationale": "One sentence: why this approach fits this component",
    "llm_use_cases": ["specific subtask to run through LLM"],
    "deterministic_use_cases": ["specific subtask to handle with code/rules"],
    "needs_evals": true,
    "eval_approach": "What you are testing: e.g. response accuracy, intent classification F1, hallucination rate",
    "eval_complexity": "Simple|Moderate|Complex",
    "example_eval": "Concrete example: e.g. 'Given ticket: [missed delivery], assert intent=logistics, assert escalation=false'"
  }
]`,
    messages: [{
      role: "user",
      content: `Problem: "${problemStatement}"\n\nFeatures to analyze:\n${features.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\nBreak down each feature by LLM vs deterministic approach and eval strategy.`,
    }],
  });

  const block = response.content[0];
  if (block.type !== "text") return [];
  try { return parseJSON(block.text); } catch { return []; }
}

// ─── Step 5: Persona synthesis ────────────────────────────────────────────────

const PERSONA_CONFIG: Record<Persona, { label: string; focus: string }> = {
  exec: {
    label: "C-suite executive",
    focus: "Focus on: total cost of ownership, time-to-value, strategic risk, vendor dependency, and which option gives the best business outcome. Use plain business language — no technical jargon. Frame everything in business impact, ROI, and risk.",
  },
  product: {
    label: "Product Manager",
    focus: "Focus on: feature coverage vs requirements, which vendor(s) best fit the use case, integration complexity, vendor lock-in risk, and roadmap implications of each path. Balance business priorities with practical product considerations.",
  },
  engineering: {
    label: "Engineering Lead",
    focus: "Focus on: actual build complexity, specific technical challenges, recommended stack and components, realistic integration effort, ongoing maintenance burden, and key architectural decisions. Be specific and technical — name real tools and frameworks.",
  },
};

export async function synthesizeForPersona(
  problemStatement: string,
  result: Omit<AnalysisResult, "persona_views">,
  persona: Persona
): Promise<PersonaView> {
  const { label, focus } = PERSONA_CONFIG[persona];

  const condensed = {
    context: result.context_summary,
    options: result.options?.map(o => ({
      title: o.title, type: o.type, tagline: o.tagline,
      pros: o.pros, cons: o.cons, cost: o.estimated_cost,
      time: o.estimated_time, risk: o.risk_level, best_for: o.best_for,
    })),
    vendors: result.top_vendors?.map(v => ({
      name: v.name, fit_score: v.fit_score, pros: v.pros.slice(0, 2), cons: v.cons.slice(0, 2),
    })),
    feasibility: result.build_feasibility_breakdown,
    challenges: result.top_build_challenges?.map(c => ({
      feature: c.feature, why_hard: c.why_hard, ai_verdict: c.ai_verdict,
      with_components_feasibility: c.with_components_feasibility,
    })),
    llm_breakdown: result.llm_vs_deterministic?.map(l => ({
      component: l.component, approach: l.approach, rationale: l.rationale,
    })),
    next_steps: result.next_steps,
  };

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are translating a build vs buy analysis for a ${label}. ${focus}

Respond with ONLY valid JSON:
{
  "persona": "${persona}",
  "headline": "One punchy sentence capturing the key verdict for this audience — specific to the actual problem and options",
  "summary": "2-3 sentences framed entirely for this audience's priorities. No jargon if exec, technical depth if engineering.",
  "key_points": ["4 specific bullet points most relevant to this persona — tied to the actual analysis, not generic"],
  "recommendation": "Clear recommended path with 1-2 sentences of reasoning in this audience's language",
  "watch_out": ["2-3 specific risks or concerns most relevant to this persona"]
}`,
    messages: [{
      role: "user",
      content: `Problem: "${problemStatement}"\n\nAnalysis:\n${JSON.stringify(condensed, null, 2)}\n\nSynthesize this for a ${label}.`,
    }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response from Claude");
  return parseJSON<PersonaView>(block.text);
}
