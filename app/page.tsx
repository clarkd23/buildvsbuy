"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AnalysisResult, DiscoveryAnswer, DiscoveryQuestion, StreamEvent } from "@/types/analysis";
import ResultsDashboard from "@/components/ResultsDashboard";
import DiscoveryPhase from "@/components/DiscoveryPhase";
import AnalysisProgressBar from "@/components/AnalysisProgressBar";

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
  const [activeChallenges, setActiveChallenges] = useState<Record<number, string>>({});
  const [doneChallenges, setDoneChallenges] = useState<number[]>([]);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Step 1: Submit problem → generate questions ───────────────────────────

  async function handleProblemSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!problem.trim()) return;
    if (!isSignedIn) {
      localStorage.setItem("bvb_problem", problem);
      router.push("/sign-in");
      return;
    }

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
    setActiveChallenges({});
    setDoneChallenges([]);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemStatement: problem, answers: discoveryAnswers }),
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
      case "challenge_start":
        if (event.challenge_index !== undefined && event.challenge_name) {
          setActiveChallenges((prev) => ({ ...prev, [event.challenge_index!]: event.challenge_name! }));
          if (event.message) setStatusMessages((prev) => [...prev, event.message!]);
        }
        break;
      case "challenge_done":
        if (event.challenge_index !== undefined)
          setDoneChallenges((prev) => [...prev, event.challenge_index!]);
        break;
      case "result":
        if (event.data) { setResult(event.data); setPhase("done"); }
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
    setActiveChallenges({});
    setDoneChallenges([]);
    setResult(null);
    setErrorMsg("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Build vs Buy</h1>
          <p className="text-gray-500 text-lg">
            AI researches the market and lays out the honest trade-offs — no verdict, just facts.
          </p>
        </div>

        {/* ── Problem input ── */}
        {(phase === "idle" || phase === "generating_questions") && (
          <form onSubmit={handleProblemSubmit} className="mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <textarea
                ref={textareaRef}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g. We need software to automate customer support ticket routing and auto-generate replies using our knowledge base..."
                className="w-full p-5 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-base leading-relaxed"
                rows={4}
                disabled={phase === "generating_questions"}
              />
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400">
                  {phase === "generating_questions"
                    ? "Generating discovery questions..."
                    : "We'll ask a few questions before researching"}
                </p>
                <button
                  type="submit"
                  disabled={!problem.trim() || phase === "generating_questions"}
                  className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {phase === "generating_questions" ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-white opacity-70 animate-pulse inline-block" />
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Analyzing</p>
                <p className="text-gray-700 font-medium truncate max-w-xl">{problem}</p>
              </div>
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">
                Start over
              </button>
            </div>
            <DiscoveryPhase
              questions={questions}
              answers={answers}
              onAnswerChange={(id, val) => setAnswers((prev) => ({ ...prev, [id]: val }))}
              onSubmit={handleDiscoverySubmit}
              loading={false}
            />
          </div>
        )}

        {/* ── Analysis progress ── */}
        {phase === "analyzing" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-medium text-gray-700">Researching the market...</span>
            </div>

            <AnalysisProgressBar done={false} />

            <div className="space-y-2 mb-4">
              {statusMessages.map((msg, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-green-500">✓</span>{msg}
                </div>
              ))}
            </div>


            {Object.keys(activeChallenges).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Deep diving build challenges</p>
                <div className="space-y-1">
                  {Object.entries(activeChallenges).map(([idx, name]) => {
                    const done = doneChallenges.includes(Number(idx));
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {done
                          ? <span className="text-green-500">✓</span>
                          : <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />}
                        <span className={done ? "text-gray-400" : "text-gray-700"}>{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {phase === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <p className="text-red-700 font-medium mb-1">Something went wrong</p>
            <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
            <div className="flex items-center gap-4">
              <button onClick={handleReset} className="text-sm text-red-700 underline">
                Start over
              </button>
              {problem.trim() && (
                <button
                  onClick={() => startAnalysis([])}
                  className="text-sm text-gray-600 underline"
                >
                  Skip discovery and analyze anyway
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {phase === "done" && result && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Analysis for</p>
                <p className="text-gray-700 font-medium truncate max-w-xl">{problem}</p>
                {questions.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Object.values(answers).filter(a => a.trim()).length} discovery answers incorporated
                  </p>
                )}
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                New analysis
              </button>
            </div>
            <ResultsDashboard result={result} />
          </div>
        )}

      </div>
    </main>
  );
}
