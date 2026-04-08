"use client";

import { useState } from "react";

interface Props {
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export default function ExpandableSection({
  title,
  summary,
  defaultOpen = false,
  children,
  badge,
  badgeColor = "bg-gray-100 text-gray-500",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{title}</span>
              {badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeColor}`}>
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{summary}</p>
          </div>
        </div>
        <span className={`text-gray-400 ml-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5">
          {children}
        </div>
      )}
    </div>
  );
}
