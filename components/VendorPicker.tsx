"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  vendors: string[];
  onChange: (vendors: string[]) => void;
}

export default function VendorPicker({ vendors, onChange }: Props) {
  const [input, setInput] = useState("");

  function add() {
    const name = input.trim();
    if (!name || vendors.some(v => v.toLowerCase() === name.toLowerCase())) return;
    onChange([...vendors, name]);
    setInput("");
  }

  function remove(name: string) {
    onChange(vendors.filter(v => v !== name));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  }

  return (
    <div className="border-t border-border px-5 py-4">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        Any specific vendors to include?
      </p>
      <p className="text-[11px] text-muted-foreground/70 mb-3">
        Added vendors are always deep-researched, regardless of search results.
      </p>

      {/* Input row */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. Salesforce, Notion, Linear..."
          className="flex-1 text-sm text-foreground placeholder-muted-foreground/50 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-foreground/30 bg-background transition-colors"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {/* Tiles */}
      {vendors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {vendors.map(name => (
            <div
              key={name}
              className="flex items-center gap-1.5 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-full"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              {name}
              <button
                type="button"
                onClick={() => remove(name)}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
