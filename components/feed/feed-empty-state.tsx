import { SearchX } from "lucide-react";
import type { FeedFilters } from "@/lib/feed-filters";

interface FeedEmptyStateProps {
  filters: FeedFilters;
  onClear: () => void;
}

/** Shown when the current search and filters match no issue. */
export function FeedEmptyState({ filters, onClear }: FeedEmptyStateProps) {
  // "הדיווחים שלי" with nothing else applied just means no reports yet.
  const noReportsYet =
    filters.view === "הדיווחים שלי" &&
    filters.query.trim() === "" &&
    filters.category === null;

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <SearchX aria-hidden className="size-8 text-slate-400" />
      <p className="text-sm font-medium text-slate-700">
        {noReportsYet
          ? "עדיין לא פרסמת דיווחים"
          : "לא נמצאו דיווחים התואמים לסינון"}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {noReportsYet ? "הצג את כל הדיווחים" : "נקה סינון"}
      </button>
    </div>
  );
}
