"use client";

import { cn } from "@/lib/cn";
import { URGENCY_LEVELS } from "@/lib/urgency";

interface UrgencyRatingProps {
  issueId: string;
  /** The current user's vote, if any. Tapping another level updates it. */
  myVote?: number;
  onVote: (value: number) => void;
}

/**
 * 1-5 urgency picker. Native radios give keyboard and screen-reader behavior
 * for free; one radio group per issue enforces a single vote per post.
 */
export function UrgencyRating({ issueId, myVote, onVote }: UrgencyRatingProps) {
  const hasVoted = myVote !== undefined;

  return (
    <fieldset className="mt-3 min-w-0">
      <legend className="sr-only">דרגו את רמת הדחיפות של הדיווח</legend>
      <p
        aria-live="polite"
        className={cn(
          "text-xs font-semibold",
          hasVoted ? "text-blue-700" : "text-slate-500",
        )}
      >
        {hasVoted
          ? "הדירוג שלך נשמר · אפשר לעדכן בכל רגע"
          : "דרגו את רמת הדחיפות"}
      </p>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {URGENCY_LEVELS.map(({ value, label }) => {
          const selected = myVote === value;
          return (
            <label
              key={value}
              className="relative block cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
            >
              <input
                type="radio"
                name={`urgency-${issueId}`}
                value={value}
                checked={selected}
                onChange={() => onVote(value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2 transition active:scale-95",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600",
                  selected
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50",
                )}
              >
                <span className="text-base font-bold leading-none">{value}</span>
                <span
                  className={cn(
                    "text-xs leading-tight",
                    selected ? "text-white" : "text-slate-500",
                  )}
                >
                  {label}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
