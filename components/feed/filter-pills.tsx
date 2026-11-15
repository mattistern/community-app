"use client";

import { cn } from "@/lib/cn";
import { FEED_VIEWS, type FeedView } from "@/lib/feed-filters";

interface FilterPillsProps {
  value: FeedView;
  onChange: (view: FeedView) => void;
}

/**
 * The filter pills (DESIGN.md §3.B). One is active at a time, so they are a
 * radio group: Tab reaches the group once and the arrow keys move between
 * pills. The row scrolls sideways when the pills don't fit the screen.
 */
export function FilterPills({ value, onChange }: FilterPillsProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">סינון דיווחים</legend>
      {/* py-1 / -my-1 leave room for the focus ring, which the scroller would clip. */}
      <div className="-mx-4 -my-1 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FEED_VIEWS.map((view) => {
          const selected = view === value;
          return (
            // relative: anchors the hidden radio (absolutely positioned) to its pill.
            // Without it the inputs escape the scroller, stretch the page sideways,
            // and focusing one scrolls the whole page.
            <label
              key={view}
              className="relative shrink-0 cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
            >
              <input
                type="radio"
                name="feed-view"
                value={view}
                checked={selected}
                onChange={() => onChange(view)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "grid h-10 place-items-center rounded-full border px-4 text-sm transition",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600",
                  selected
                    ? "border-slate-900 bg-slate-900 font-semibold text-white"
                    : "border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-100",
                )}
              >
                {view}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
