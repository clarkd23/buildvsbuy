import { NextRequest, after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  generateSearchQuery,
  analyzeVendors,
  identifyComponents,
  analyzeBuildChallenge,
  analyzeLLMvsDeterministic,
  buildEnrichedContext,
} from "@/lib/claude";
import { searchVendors, scrapeVendors } from "@/lib/firecrawl";
import { DiscoveryAnswer, StreamEvent } from "@/types/analysis";
import { getOrCreateUser, incrementUsage } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export const maxDuration = 180;

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { problemStatement, answers } = await req.json() as {
    problemStatement: string;
    answers?: DiscoveryAnswer[];
  };
  if (!problemStatement?.trim()) {
    return new Response("Problem statement is required", { status: 400 });
  }

  // Weave discovery answers into an enriched context for all downstream Claude calls
  const enrichedProblem = buildEnrichedContext(problemStatement, answers ?? []);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── 1. Generate search query ──────────────────────────────────────────
        controller.enqueue(encode({ type: "status", message: "Generating vendor search query..." }));
        const searchQuery = await generateSearchQuery(problemStatement);

        // ── 2. Search for vendors ─────────────────────────────────────────────
        controller.enqueue(encode({ type: "status", message: `Searching: "${searchQuery}"...` }));
        const vendors = await searchVendors(searchQuery);
        controller.enqueue(encode({
          type: "vendors_found",
          vendors: vendors.map((v) => v.name),
          message: `Found ${vendors.length} vendors`,
        }));

        // ── 3. Scrape vendor sites (top 6 deep; rest found-only) ─────────────
        controller.enqueue(encode({ type: "status", message: "Deep researching vendor websites..." }));
        const vendorData = await scrapeVendors(vendors);
        const researchedCount = vendorData.filter(v => v.researched).length;
        controller.enqueue(encode({ type: "scraping_complete", message: `${vendors.length} vendors found · ${researchedCount} deep researched` }));

        // ── 4. Main analysis ──────────────────────────────────────────────────
        controller.enqueue(encode({ type: "status", message: "Analyzing build vs buy trade-offs..." }));
        const baseAnalysis = await analyzeVendors(enrichedProblem, vendorData);
        controller.enqueue(encode({ type: "analysis_complete", message: "Core analysis done — diving into top build challenges..." }));

        // ── 5+6. Challenges + LLM analysis all in parallel ───────────────────
        const hardestItems = [...(baseAnalysis.build_feasibility_breakdown ?? [])]
          .sort((a, b) => a.feasibility_score - b.feasibility_score)
          .slice(0, 3);

        const featureNames = baseAnalysis.build_feasibility_breakdown.map((f) => f.feature);

        // Announce all challenges upfront
        hardestItems.forEach((item, i) => {
          controller.enqueue(encode({
            type: "challenge_start",
            challenge_name: item.feature,
            challenge_index: i,
            message: `Analyzing challenge: "${item.feature}"...`,
          }));
        });
        controller.enqueue(encode({ type: "llm_analysis", message: "Analyzing LLM vs deterministic trade-offs..." }));

        const [challengeResults, llmVsDet] = await Promise.all([
          Promise.allSettled(
            hardestItems.map(async (item, i) => {
              const componentRefs = await identifyComponents(enrichedProblem, item);

              let componentData: { name: string; url: string; category: string; why_relevant: string; scraped_content: string }[] = [];
              if (componentRefs.length > 0) {
                const { scrape } = await import("@/lib/firecrawl");
                const scrapeResults = await Promise.allSettled(
                  componentRefs.map(async (c) => {
                    const content = await scrape(c.url);
                    return { name: c.component_name, url: c.url, category: c.category, why_relevant: c.why_relevant, scraped_content: content };
                  })
                );
                componentData = scrapeResults
                  .filter((r): r is PromiseFulfilledResult<typeof componentData[0]> => r.status === "fulfilled")
                  .map((r) => r.value);
              }

              const challenge = await analyzeBuildChallenge(enrichedProblem, item, componentData);

              controller.enqueue(encode({
                type: "challenge_done",
                challenge_index: i,
                message: `Done: "${item.feature}"`,
              }));

              return challenge;
            })
          ),
          analyzeLLMvsDeterministic(enrichedProblem, featureNames),
        ]);

        const topBuildChallenges = challengeResults
          .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof analyzeBuildChallenge>>> => r.status === "fulfilled")
          .map((r) => r.value);

        // ── 7. Inject researched flags into vendor list, stream final result ──
        const researchedUrls = new Set(vendorData.filter(v => v.researched).map(v => v.url));
        const vendorsWithFlags = baseAnalysis.top_vendors.map(v => ({
          ...v,
          researched: researchedUrls.has(v.url),
        }));

        const finalResult = {
          ...baseAnalysis,
          top_vendors: vendorsWithFlags,
          top_build_challenges: topBuildChallenges,
          llm_vs_deterministic: llmVsDet,
        };

        controller.enqueue(encode({ type: "result", data: finalResult }));

        // Persist analysis + fire lead webhook after stream closes
        after(async () => {
          try {
            const user = await getOrCreateUser(userId, "");
            await incrementUsage(userId);
            const analysis = await prisma.analysis.create({
              data: {
                userId: user.id,
                problemStatement,
                resultJson: finalResult as object,
              },
            });

            if (process.env.LEAD_WEBHOOK_URL) {
              await fetch(process.env.LEAD_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user.email,
                  problemStatement,
                  analysisId: analysis.id,
                  createdAt: analysis.createdAt,
                }),
              });
            }
          } catch (err) {
            console.error("[analyze] post-response hook failed:", err);
          }
        });

      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
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
      Connection: "keep-alive",
    },
  });
}
