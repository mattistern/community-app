"use client";

import { cn } from "@/lib/cn";
import { ISSUE_CATEGORIES, type IssueCategory } from "@/lib/types";

interface CategoryPickerProps {
  value: IssueCategory | null;
  onChange: (category: IssueCategory | null) => void;
}

/** Optional category pills; tapping the chosen one again clears it. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ISSUE_CATEGORIES.map((category) => {
        const selected = category === value;
        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : category)}
            className={cn(
              "h-10 rounded-full border px-4 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
              selected
                ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                : "border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50",
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
