import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  generateSearchQuery,
  analyzeVendors,
  identifyComponents,
  analyzeBuildChallenge,
  generateNextSteps,
  buildEnrichedContext,
  synthesizeForPersona,
} from "@/lib/claude";
import { Persona } from "@/types/analysis";
import { searchVendors, scrapeVendors, searchVendorUrl } from "@/lib/firecrawl";
import { DiscoveryAnswer, StreamEvent } from "@/types/analysis";
import { getOrCreateUser, incrementUsage } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

const t0 = () => `[analyze +${((Date.now() - (globalThis as unknown as {_t0?: number})._t0!) / 1000).toFixed(1)}s]`;

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: NextRequest) {
  // AUTH DISABLED — re-enable when ready
  // const { userId } = await auth();
  // if (!userId) return new Response("Unauthorized", { status: 401 });
  const { userId } = { userId: "anonymous" };

  const { problemStatement, answers, customVendors } = await req.json() as {
    problemStatement: string;
    answers?: DiscoveryAnswer[];
    customVendors?: string[];
  };
  if (!problemStatement?.trim()) {
    return new Response("Problem statement is required", { status: 400 });
  }

  // Weave discovery answers into an enriched context for all downstream Claude calls
  const enrichedProblem = buildEnrichedContext(problemStatement, answers ?? []);

  const stream = new ReadableStream({
    async start(controller) {
      (globalThis as unknown as {_t0?: number})._t0 = Date.now();
      console.log("[analyze] start");
      try {
        const timeout = <T>(ms: number, label: string, promise: Promise<T>): Promise<T> =>
          Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms))]);

        // ── 1. Generate search query ──────────────────────────────────────────
        controller.enqueue(encode({ type: "status", message: "Generating vendor search query..." }));
        const searchQuery = await timeout(30_000, "generateSearchQuery", generateSearchQuery(problemStatement));
        console.log(t0(), "searchQuery:", searchQuery);

        // ── 2. Search for vendors ─────────────────────────────────────────────
        controller.enqueue(encode({ type: "status", message: `Searching: "${searchQuery}"...` }));
        const vendors = await timeout(30_000, "searchVendors", searchVendors(searchQuery));
        console.log(t0(), "vendors found:", vendors.length);
        controller.enqueue(encode({
          type: "vendors_found",
          vendors: vendors.map((v) => v.name),
          message: `Found ${vendors.length} vendors`,
        }));

        // ── 2b. Prepend any user-specified vendors (look up URLs in parallel) ──
        if (customVendors?.length) {
          controller.enqueue(encode({ type: "status", message: `Looking up ${customVendors.length} custom vendor(s)...` }));
          const customResults = await Promise.all(customVendors.map(name => searchVendorUrl(name)));
          const found = customResults.filter((v): v is NonNullable<typeof v> => v !== null);
          // Prepend so they're always in the scrape window; dedupe by url
          const existingUrls = new Set(vendors.map(v => v.url));
          for (const v of found.reverse()) {
            if (!existingUrls.has(v.url)) { vendors.unshift(v); existingUrls.add(v.url); }
          }
          console.log(t0(), "custom vendors resolved:", found.map(v => v.name));
        }

        // ── 3. Scrape vendor sites (top 6 deep; rest found-only) ─────────────
        controller.enqueue(encode({ type: "status", message: "Deep researching vendor websites..." }));
        const vendorData = await timeout(60_000, "scrapeVendors", scrapeVendors(vendors));
        const researchedCount = vendorData.filter(v => v.researched).length;
        console.log(t0(), "scraping complete:", researchedCount, "researched");
        controller.enqueue(encode({ type: "scraping_complete", message: `${vendors.length} vendors found · ${researchedCount} deep researched` }));

        // ── 4. Main analysis ──────────────────────────────────────────────────
        controller.enqueue(encode({ type: "status", message: "Analyzing build vs buy trade-offs..." }));
        const baseAnalysis = await timeout(150_000, "analyzeVendors", analyzeVendors(enrichedProblem, vendorData));
        console.log(t0(), "baseAnalysis done, features:", baseAnalysis.build_feasibility_breakdown?.length);
        controller.enqueue(encode({ type: "analysis_complete", message: "Core analysis done..." }));

        // ── 6. Stream result immediately (challenges load after) ──────────────
        const researchedUrls = new Set(vendorData.filter(v => v.researched).map(v => v.url));
        const vendorsWithFlags = baseAnalysis.top_vendors.map(v => ({
          ...v,
          researched: researchedUrls.has(v.url),
        }));

        // Inject researched flag into vendor_shortlist too
        const shortlistWithFlags = (baseAnalysis.vendor_shortlist ?? []).map(v => ({
          ...v,
          researched: researchedUrls.has(v.url),
        }));

        const finalResult = {
          ...baseAnalysis,
          top_vendors: vendorsWithFlags,
          vendor_shortlist: shortlistWithFlags,
          top_build_challenges: [],
          llm_vs_deterministic: [],
          next_steps: [],
          persona_views: [],
        };

        console.log(t0(), "streaming final result");
        controller.enqueue(encode({ type: "result", data: finalResult }));

        // ── 7. Persist base result immediately to get a share ID ─────────────
        let analysisId: string | null = null;
        try {
          const record = await prisma.analysis.create({
            data: { userId: null, problemStatement, resultJson: finalResult as object },
          });
          analysisId = record.id;
          controller.enqueue(encode({ type: "share_id", share_id: analysisId }));
          console.log(t0(), "persisted analysis, id:", analysisId);
        } catch (err) {
          console.error("[analyze] initial persist failed:", err);
        }

        // ── 8. Post-result: challenges + next steps + personas ─────────────────
        console.log(t0(), "starting post-result parallel work...");

        const hardestItems = [...(baseAnalysis.build_feasibility_breakdown ?? [])]
          .sort((a, b) => a.feasibility_score - b.feasibility_score)
          .slice(0, 2);

        // Signal how many challenges to expect
        if (hardestItems.length > 0) {
          controller.enqueue(encode({ type: "challenges_loading", challenges_count: hardestItems.length }));
        }

        // Challenge promises — each streams when done
        const challengePromises = hardestItems.map(async (item, i) => {
          console.log(t0(), `challenge[${i}] start: ${item.feature}`);
          const componentRefs = await identifyComponents(enrichedProblem, item);
          console.log(t0(), `challenge[${i}] components identified:`, componentRefs.map(c => c.component_name));

          let componentData: { name: string; url: string; category: string; why_relevant: string; scraped_content: string }[] = [];
          if (componentRefs.length > 0) {
            const { scrape } = await import("@/lib/firecrawl");
            const scrapeResults = await Promise.allSettled(
              componentRefs.map(async (c) => {
                console.log(t0(), `challenge[${i}] scraping: ${c.url}`);
                const content = await scrape(c.url);
                console.log(t0(), `challenge[${i}] scraped: ${c.url} (${content.length} chars)`);
                return { name: c.component_name, url: c.url, category: c.category, why_relevant: c.why_relevant, scraped_content: content };
              })
            );
            componentData = scrapeResults
              .filter((r): r is PromiseFulfilledResult<typeof componentData[0]> => r.status === "fulfilled")
              .map((r) => r.value);
          }

          console.log(t0(), `challenge[${i}] calling analyzeBuildChallenge...`);
          const challenge = await Promise.race([
            analyzeBuildChallenge(enrichedProblem, item, componentData),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`challenge[${i}] timed out`)), 50_000)),
          ]);
          console.log(t0(), `challenge[${i}] done: ${item.feature}`);
          controller.enqueue(encode({ type: "challenge_result", challenge_result: challenge }));
          return challenge;
        });

        // Persona synthesis — each streams when done
        const personas: Persona[] = ["exec", "product", "engineering"];
        const synthesisPromises = personas.map(persona =>
          Promise.race([
            synthesizeForPersona(enrichedProblem, finalResult, persona).then(view => {
              console.log(t0(), `persona[${persona}] done`);
              controller.enqueue(encode({ type: "persona_view", persona_view: view }));
              return view;
            }),
            new Promise<null>(resolve => setTimeout(() => {
              console.log(t0(), `persona[${persona}] timed out`);
              resolve(null);
            }, 30_000)),
          ])
        );

        const [nextSteps, , personaSettled, challengeSettled] = await Promise.all([
          Promise.race([
            generateNextSteps(
              enrichedProblem,
              baseAnalysis.context_summary,
              baseAnalysis.options.map(o => o.title)
            ).then(r => { console.log(t0(), "next steps done:", r.length); return r; }),
            new Promise<[]>(resolve => setTimeout(() => {
              console.log(t0(), "next steps timed out");
              resolve([]);
            }, 20_000)),
          ]),
          Promise.resolve(), // placeholder slot
          Promise.allSettled(synthesisPromises),
          Promise.allSettled(challengePromises),
        ]);

        if (nextSteps.length > 0) {
          controller.enqueue(encode({ type: "next_steps", next_steps: nextSteps }));
        }

        // Update the persisted record with the full result (challenges + personas + next steps)
        if (analysisId) {
          try {
            const challenges = challengeSettled
              .filter((x): x is PromiseFulfilledResult<Awaited<typeof challengePromises[0]>> => x.status === "fulfilled")
              .map(x => x.value);
            const personaViews = personaSettled
              .filter((x): x is PromiseFulfilledResult<Awaited<typeof synthesisPromises[0]>> => x.status === "fulfilled")
              .map(x => x.value)
              .filter(Boolean);
            await prisma.analysis.update({
              where: { id: analysisId },
              data: {
                resultJson: {
                  ...finalResult,
                  top_build_challenges: challenges,
                  persona_views: personaViews,
                  next_steps: nextSteps,
                } as object,
              },
            });
            console.log(t0(), "updated analysis with full result");
          } catch (err) {
            console.error("[analyze] update persist failed:", err);
          }
        }

      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        console.error(t0(), "ERROR:", message);
        controller.enqueue(encode({ type: "error", error: message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
