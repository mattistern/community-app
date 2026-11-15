import { Clock, ImageOff } from "lucide-react";
import { formatRemaining } from "@/lib/format-time";
import { MEDIA_GRACE_PERIOD_MS, msUntilMediaDeletion } from "@/lib/media-cleanup";
import type { Issue } from "@/lib/types";
import { MINUTE_MS } from "@/lib/use-minute-clock";

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium";

/**
 * Where an issue's photo stands in the 7-day lifecycle (CLAUDE.md §3): a
 * countdown while a resolved issue waits out its grace period, a note once the
 * photo has been deleted, nothing otherwise.
 */
export function LifecycleChip({ issue, now }: { issue: Issue; now: number }) {
  const msLeft = msUntilMediaDeletion(issue, now);

  if (msLeft !== null) {
    return (
      <span className={`${CHIP} border-amber-200 bg-amber-50 text-amber-900`}>
        <Clock aria-hidden className="size-3.5 shrink-0" />
        {/* `now` is the minute clock, which rounds down, so the time left can read up to a minute
            too long (even more than the whole grace period, for a report resolved a moment ago).
            Without the cap and the minute taken off, a fresh 7-day wait would say "8 ימים". */}
        {msLeft <= 0
          ? "המדיה תימחק בקרוב"
          : `המדיה תימחק בעוד ${formatRemaining(Math.min(msLeft, MEDIA_GRACE_PERIOD_MS) - MINUTE_MS)}`}
      </span>
    );
  }

  if (!issue.media && issue.mediaRemovedAt) {
    return (
      <span className={`${CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
        <ImageOff aria-hidden className="size-3.5 shrink-0" />
        המדיה נמחקה
      </span>
    );
  }

  return null;
}
