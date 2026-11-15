import { Star } from "lucide-react";
import { averageRating, formatVoteCount } from "@/lib/urgency";

interface UrgencyScoreProps {
  ratingSum: number;
  voteCount: number;
}

/** Average urgency and total votes, e.g. `4.7 ★ (24 הצבעות)`. */
export function UrgencyScore({ ratingSum, voteCount }: UrgencyScoreProps) {
  if (voteCount === 0) {
    return <p className="text-sm text-slate-500">{formatVoteCount(0)}</p>;
  }

  return (
    <p className="flex items-center gap-1 text-sm" aria-live="polite">
      <span className="sr-only">ממוצע דחיפות</span>
      <span className="font-bold text-slate-900">
        {averageRating(ratingSum, voteCount).toFixed(1)}
      </span>
      <Star aria-hidden className="size-4 fill-amber-400 stroke-amber-400" />
      <span className="text-slate-500">({formatVoteCount(voteCount)})</span>
    </p>
  );
}
