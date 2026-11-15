import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Issue } from "@/lib/types";
import { AdminNote } from "./admin-note";
import { CommentsLink } from "./comments-link";
import { MediaThumbnail } from "./media-thumbnail";
import { RelativeTime } from "./relative-time";
import { ShareButton } from "./share-button";
import { StatusBadge } from "./status-badge";
import { UrgencyRating } from "./urgency-rating";
import { UrgencyScore } from "./urgency-score";

interface IssueCardProps {
  issue: Issue;
  onVote: (issueId: string, value: number) => void;
  /** Load this card's thumbnail immediately (above the fold). */
  eagerMedia?: boolean;
  /** Briefly ringed, e.g. the report the resident has just sent. */
  highlighted?: boolean;
}

export function IssueCard({
  issue,
  onVote,
  eagerMedia,
  highlighted,
}: IssueCardProps) {
  const titleId = `issue-${issue.id}-title`;
  const hasMeta = Boolean(issue.category || issue.location);

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-500",
        highlighted && "ring-2 ring-blue-500/60 ring-offset-2 ring-offset-slate-50",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <RelativeTime iso={issue.createdAt} className="text-xs text-slate-500" />
        <StatusBadge status={issue.status} />
      </div>

      {hasMeta && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {issue.category && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {issue.category}
            </span>
          )}
          {issue.location && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <MapPin aria-hidden className="size-3.5" />
              {issue.location}
            </span>
          )}
        </div>
      )}

      <h2
        id={titleId}
        className={cn(
          "text-base font-bold leading-snug text-slate-900",
          hasMeta ? "mt-2.5" : "mt-3",
        )}
      >
        <Link
          href={`/issue/${issue.id}`}
          className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {issue.title}
        </Link>
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        {issue.description}
      </p>

      {issue.adminNote && <AdminNote note={issue.adminNote} />}
      {issue.media && (
        <MediaThumbnail media={issue.media} eager={eagerMedia} />
      )}

      <footer className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between gap-3">
          <UrgencyScore
            ratingSum={issue.ratingSum}
            voteCount={issue.voteCount}
          />
          <div className="flex items-center">
            <CommentsLink issueId={issue.id} />
            <ShareButton issueId={issue.id} title={issue.title} />
          </div>
        </div>
        <UrgencyRating
          issueId={issue.id}
          myVote={issue.myVote}
          onVote={(value) => onVote(issue.id, value)}
        />
      </footer>
    </article>
  );
}
