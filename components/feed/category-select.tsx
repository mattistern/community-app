"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  ISSUE_CATEGORIES,
  isIssueCategory,
  type IssueCategory,
} from "@/lib/types";

const ALL_CATEGORIES = "";

interface CategorySelectProps {
  /** null means all categories. */
  value: IssueCategory | null;
  onChange: (category: IssueCategory | null) => void;
}

/**
 * Category filter. A native <select> gives the phone's own picker and full
 * accessibility; it is highlighted while a category is active. 16px text avoids
 * iOS Safari's zoom-on-focus.
 */
export function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <div className="relative shrink-0">
      <select
        aria-label="סינון לפי קטגוריה"
        value={value ?? ALL_CATEGORIES}
        onChange={(event) =>
          onChange(isIssueCategory(event.target.value) ? event.target.value : null)
        }
        className={cn(
          "h-11 appearance-none rounded-xl border ps-3 pe-9 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
          value === null
            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : "border-blue-600 bg-blue-50 text-blue-700",
        )}
      >
        <option value={ALL_CATEGORIES}>כל הקטגוריות</option>
        {ISSUE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}
