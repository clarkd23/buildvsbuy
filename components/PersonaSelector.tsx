"use client";

import { Persona } from "@/types/analysis";

const PERSONAS: { id: Persona; label: string; description: string }[] = [
  { id: "exec",        label: "Executive",   description: "Cost, risk & decision" },
  { id: "product",     label: "Product",     description: "Features & vendors" },
  { id: "engineering", label: "Engineering", description: "Build complexity & stack" },
];

export default function PersonaSelector({
  selected,
  onChange,
}: {
  selected: Persona;
  onChange: (p: Persona) => void;
}) {
  return (
    <div className="px-5 py-4 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground mb-3">Who&apos;s reading this analysis?</p>
      <div className="grid grid-cols-3 gap-2">
        {PERSONAS.map((p) => {
          const active = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`flex flex-col items-start px-3.5 py-3 rounded-xl border text-left transition-all ${
                active
                  ? "border-foreground bg-foreground text-background shadow-sm"
                  : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted/40"
              }`}
            >
              <span className={`text-xs font-semibold leading-tight ${active ? "text-background" : "text-foreground"}`}>
                {p.label}
              </span>
              <span className={`text-[11px] leading-tight mt-0.5 ${active ? "text-background/70" : "text-muted-foreground"}`}>
                {p.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
