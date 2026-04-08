"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AnalysisResult, DiscoveryAnswer, DiscoveryQuestion, Persona, StreamEvent } from "@/types/analysis";
import ResultsDashboard from "@/components/ResultsDashboard";
import DiscoveryPhase from "@/components/DiscoveryPhase";
import AnalysisProgressBar from "@/components/AnalysisProgressBar";
import ExportButton from "@/components/ExportButton";
import PersonaSelector from "@/components/PersonaSelector";

type Phase = "idle" | "generating_questions" | "discovery" | "analyzing" | "done" | "error";

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [problem, setProblem] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bvb_problem");
      if (saved) { localStorage.removeItem("bvb_problem"); return saved; }
    }
    return "";
  });
  const [phase, setPhase] = useState<Phase>("idle");

  // Discovery
  const [questions, setQuestions] = useState<DiscoveryQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Analysis progress
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [challengesExpected, setChallengesExpected] = useState(0);
  const [customVendors, setCustomVendors] = useState<string[]>([]);

  const [selectedPersona, setSelectedPersona] = useState<Persona>("exec");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Step 1: Submit problem → generate questions ───────────────────────────

  async function handleProblemSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!problem.trim()) return;
    // AUTH DISABLED — re-enable sign-in redirect when ready
    // if (!isSignedIn) {
    //   localStorage.setItem("bvb_problem", problem);
    //   router.push("/sign-in");
    //   return;
    // }

    setPhase("generating_questions");
    setQuestions([]);
    setAnswers({});
    setErrorMsg("");

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemStatement: problem }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to generate questions");

      if (data.questions?.length > 0) {
        setQuestions(data.questions);
        setPhase("discovery");
      } else {
        throw new Error("No questions returned — please try again");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to generate discovery questions.");
      setPhase("error");
    }
  }

  // ── Step 2: User completes discovery → start research ────────────────────

  async function handleDiscoverySubmit() {
    const discoveryAnswers: DiscoveryAnswer[] = questions.map((q) => ({
      question: q.question,
      answer: answers[q.id] ?? "",
    }));
    await startAnalysis(discoveryAnswers);
  }

  // ── Step 3: Run full analysis pipeline ───────────────────────────────────

  async function startAnalysis(discoveryAnswers: DiscoveryAnswer[]) {
    setPhase("analyzing");
    setStatusMessages([]);
    setVendors([]);
    setChallengesExpected(0);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemStatement: problem, answers: discoveryAnswers, customVendors }),
      });

      if (!response.ok) throw new Error("Request failed");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try { handleStreamEvent(JSON.parse(line.slice(6)) as StreamEvent); }
          catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }

  function handleStreamEvent(event: StreamEvent) {
    switch (event.type) {
      case "status":
      case "analysis_complete":
      case "scraping_complete":
      case "llm_analysis":
        if (event.message) setStatusMessages((prev) => [...prev, event.message!]);
        break;
      case "vendors_found":
        if (event.vendors) setVendors(event.vendors);
        if (event.message) setStatusMessages((prev) => [...prev, event.message!]);
        break;
      case "result":
        if (event.data) { setResult({ ...event.data, persona_views: [] }); setPhase("done"); }
        break;
      case "challenges_loading":
        if (event.challenges_count) setChallengesExpected(event.challenges_count);
        break;
      case "challenge_result":
        if (event.challenge_result) {
          setResult(prev => prev ? { ...prev, top_build_challenges: [...(prev.top_build_challenges ?? []), event.challenge_result!] } : prev);
        }
        break;
      case "persona_view":
        if (event.persona_view) {
          setResult(prev => prev ? { ...prev, persona_views: [...(prev.persona_views ?? []), event.persona_view!] } : prev);
        }
        break;
      case "next_steps":
        if (event.next_steps) {
          setResult(prev => prev ? { ...prev, next_steps: event.next_steps! } : prev);
        }
        break;
      case "error":
        setErrorMsg(event.error || "Unknown error");
        setPhase("error");
        break;
    }
  }

  function handleReset() {
    setPhase("idle");
    setQuestions([]);
    setAnswers({});
    setStatusMessages([]);
    setVendors([]);
    setChallengesExpected(0);
    setCustomVendors([]);
    setResult(null);
    setErrorMsg("");
    setSelectedPersona("exec");
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-14">

        {/* ── Hero ── */}
        {(phase === "idle" || phase === "generating_questions") && (
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <span className="text-3xl font-bold tracking-tight text-foreground">buyorbuild</span>
              <span className="text-3xl font-bold tracking-tight text-muted-foreground">.ai</span>
            </div>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Describe what you need. AI researches the market, evaluates vendors, and maps the honest trade-offs.
            </p>
          </div>
        )}

        {/* ── Problem input ── */}
        {(phase === "idle" || phase === "generating_questions") && (
          <form onSubmit={handleProblemSubmit} className="mb-8">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <textarea
                ref={textareaRef}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g. We need software to automate customer support ticket routing and auto-generate replies using our knowledge base..."
                className="w-full px-5 pt-5 pb-3 text-foreground placeholder-muted-foreground/60 resize-none focus:outline-none text-base leading-relaxed bg-transparent"
                rows={4}
                disabled={phase === "generating_questions"}
              />
              <PersonaSelector selected={selectedPersona} onChange={setSelectedPersona} />
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  {phase === "generating_questions"
                    ? "Generating discovery questions..."
                    : "A few quick questions before we start researching"}
                </p>
                <button
                  type="submit"
                  disabled={!problem.trim() || phase === "generating_questions"}
                  className="bg-foreground text-background px-5 py-2 rounded-lg text-sm font-medium hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  {phase === "generating_questions" ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-background/70 animate-pulse inline-block" />
                      Thinking...
                    </span>
                  ) : "Continue →"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Discovery phase ── */}
        {phase === "discovery" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Analyzing</p>
                <p className="text-foreground font-medium truncate max-w-xl">{problem}</p>
              </div>
              <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Start over
              </button>
            </div>
            <DiscoveryPhase
              questions={questions}
              answers={answers}
              onAnswerChange={(id, val) => setAnswers((prev) => ({ ...prev, [id]: val }))}
              onSubmit={handleDiscoverySubmit}
              loading={false}
              customVendors={customVendors}
              onVendorsChange={setCustomVendors}
            />
          </div>
        )}

        {/* ── Analysis progress ── */}
        {phase === "analyzing" && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold text-foreground">Researching the market...</span>
            </div>

            <AnalysisProgressBar done={false} />

            <div className="space-y-2 mb-4 mt-4">
              {statusMessages.map((msg, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-emerald-500 font-medium">✓</span>{msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {phase === "error" && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 mb-8">
            <p className="text-destructive font-semibold mb-1">Something went wrong</p>
            <p className="text-destructive/80 text-sm mb-4">{errorMsg}</p>
            <div className="flex items-center gap-4">
              <button onClick={handleReset} className="text-sm text-destructive underline underline-offset-2">
                Start over
              </button>
              {problem.trim() && (
                <button onClick={() => startAnalysis([])} className="text-sm text-muted-foreground underline underline-offset-2">
                  Skip discovery and analyze anyway
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {phase === "done" && result && (
          <div>
            <div className="flex items-start justify-between mb-7 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Analysis for</p>
                <p className="text-foreground font-semibold truncate max-w-xl">{problem}</p>
                {questions.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Object.values(answers).filter(a => a.trim()).length} discovery answers incorporated
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ExportButton result={result} problem={problem} />
                <button
                  onClick={handleReset}
                  className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
                >
                  New analysis
                </button>
              </div>
            </div>
            <ResultsDashboard result={result} selectedPersona={selectedPersona} onPersonaChange={setSelectedPersona} challengesExpected={challengesExpected} />
          </div>
        )}

      </div>
    </main>
  );
}
