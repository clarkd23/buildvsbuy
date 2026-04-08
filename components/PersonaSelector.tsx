"use client";

import { Persona } from "@/types/analysis";

const PERSONAS: { id: Persona; label: string; description: string; icon: string }[] = [
  { id: "exec",        label: "Executive",   description: "Cost, risk & decision",        icon: "◆" },
  { id: "product",     label: "Product",     description: "Features, vendors & roadmap",  icon: "◈" },
  { id: "engineering", label: "Engineering", description: "Build complexity & stack",     icon: "◇" },
];

export default function PersonaSelector({
  selected,
  onChange,
}: {
  selected: Persona;
  onChange: (p: Persona) => void;
}) {
  return (
    <div className="px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400 mb-2">Who&apos;s reading this analysis?</p>
      <div className="flex gap-2">
        {PERSONAS.map((p) => {
          const active = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`flex-1 flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className={`text-base mb-0.5 ${active ? "text-white" : "text-gray-400"}`}>{p.icon}</span>
              <span className="text-xs font-semibold leading-tight">{p.label}</span>
              <span className={`text-xs leading-tight mt-0.5 ${active ? "text-gray-300" : "text-gray-400"}`}>
                {p.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
