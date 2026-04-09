import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnalysisResult } from "@/types/analysis";
import ShareView from "@/components/ShareView";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let analysis: { problemStatement: string; resultJson: unknown } | null = null;
  try {
    analysis = await prisma.analysis.findUnique({ where: { id } });
  } catch {
    notFound();
  }

  if (!analysis) notFound();

  const result = analysis.resultJson as AnalysisResult;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="flex items-start justify-between mb-7 gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Analysis for</p>
            <p className="text-foreground font-semibold truncate max-w-xl">{analysis.problemStatement}</p>
          </div>
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors shrink-0"
          >
            Try it yourself →
          </a>
        </div>
        <ShareView result={result} problem={analysis.problemStatement} />
      </div>
    </main>
  );
}
