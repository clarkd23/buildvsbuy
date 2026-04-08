"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { AnalysisResult } from "@/types/analysis";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function buildContext(problem: string, result: AnalysisResult): string {
  const lines: string[] = [
    `Problem: "${problem}"`,
    ``,
    `Context: ${result.context_summary}`,
    ``,
    `Strategic options:`,
    ...(result.options ?? []).map(o =>
      `- ${o.title} (${o.type}): ${o.tagline} | Cost: ${o.estimated_cost} | Risk: ${o.risk_level}${o.estimated_time ? ` | Time: ${o.estimated_time}` : ""}`
    ),
    ``,
    `All vendors considered:`,
    ...(result.vendor_shortlist ?? [])
      .sort((a, b) => b.fit_score - a.fit_score)
      .map(v => `- ${v.name} [${v.fit_score}/10]: ${v.verdict}`),
    ``,
  ];

  if (result.top_build_challenges?.length) {
    lines.push(`Top build challenges:`);
    result.top_build_challenges.forEach(c => {
      lines.push(`- ${c.feature}: ${c.why_hard}`);
      if (c.components?.length) {
        lines.push(`  Components: ${c.components.map(x => x.name).join(", ")}`);
      }
    });
    lines.push(``);
  }

  if (result.next_steps?.length) {
    lines.push(`Recommended next steps:`);
    result.next_steps.forEach(s => lines.push(`- [${s.priority}] ${s.action}`));
  }

  return lines.join("\n");
}

const SUGGESTIONS = [
  "What's the total cost over 12 months for each option?",
  "Which option would you pick for a small team?",
  "What are the biggest risks I should flag to leadership?",
  "How long would the build option realistically take?",
];

export default function AnalysisChat({
  result,
  problem,
  open,
  onClose,
}: {
  result: AnalysisResult;
  problem: string;
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const context = buildContext(problem, result);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Try again." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[420px] bg-background border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="font-semibold text-foreground text-sm">Ask about this analysis</p>
            <p className="text-xs text-muted-foreground">AI has full context of the results</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground text-center pt-4">
                Ask anything about the analysis — costs, risks, trade-offs, next steps.
              </p>
              <div className="space-y-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="w-full text-left text-xs text-foreground bg-muted/50 hover:bg-muted border border-border rounded-xl px-3.5 py-2.5 transition-colors leading-relaxed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground text-background rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content || (
                    <span className="flex gap-1 items-center py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a follow-up question..."
              rows={1}
              className="flex-1 text-sm text-foreground placeholder-muted-foreground/60 border border-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-foreground/30 bg-background resize-none transition-colors"
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="h-[42px] px-4 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity shrink-0"
            >
              Send
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}
