/**
 * The media lifecycle (CLAUDE.md §3): when an admin resolves an issue (בוצע or
 * נדחה) its media is scheduled for deletion after a 7-day grace period, and
 * moving the status back cancels that. Pure functions: today they run over the
 * local data; later the same rules decide what a scheduled server job deletes.
 */
import type { Issue, IssueStatus } from "./types";

export const MEDIA_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export function isResolvedStatus(status: IssueStatus): boolean {
  return status === "בוצע" || status === "נדחה";
}

/**
 * The issue after an admin sets `status`. Resolving it starts the grace period
 * (a new timestamp every time the status moves to בוצע or נדחה, so correcting a
 * mistake can only delay a deletion, never bring it forward); moving it back to
 * an open status cancels the deletion. Setting the same status changes nothing.
 */
export function withStatus(
  issue: Issue,
  status: IssueStatus,
  now: number,
): Issue {
  if (status === issue.status) return issue;
  return {
    ...issue,
    status,
    resolvedAt: isResolvedStatus(status) ? new Date(now).toISOString() : undefined,
  };
}

/**
 * Milliseconds until the issue's media is deleted; zero or less means it is
 * due. Null when nothing is scheduled: the issue isn't resolved, has no media,
 * or its media is already gone.
 */
export function msUntilMediaDeletion(issue: Issue, now: number): number | null {
  if (!issue.media || !issue.resolvedAt || !isResolvedStatus(issue.status)) {
    return null;
  }
  const resolvedAt = Date.parse(issue.resolvedAt);
  if (Number.isNaN(resolvedAt)) return null;
  return resolvedAt + MEDIA_GRACE_PERIOD_MS - now;
}

/**
 * Deletes the media of every issue whose grace period has passed and keeps the
 * rest of its record (text, votes, status), noting when it happened. Returns
 * the very same array when nothing is due.
 */
export function sweepExpiredMedia(
  issues: Issue[],
  now: number,
): { issues: Issue[]; removedFrom: string[] } {
  const removedFrom: string[] = [];
  const swept = issues.map((issue) => {
    const remaining = msUntilMediaDeletion(issue, now);
    if (remaining === null || remaining > 0) return issue;
    removedFrom.push(issue.id);
    return {
      ...issue,
      media: undefined,
      mediaRemovedAt: new Date(now).toISOString(),
    };
  });
  return removedFrom.length === 0
    ? { issues, removedFrom }
    : { issues: swept, removedFrom };
}

/** Demo helper: pretends `ms` has passed by moving every resolved timestamp back. */
export function shiftResolvedTimes(issues: Issue[], ms: number): Issue[] {
  return issues.map((issue) =>
    issue.resolvedAt
      ? {
          ...issue,
          resolvedAt: new Date(Date.parse(issue.resolvedAt) - ms).toISOString(),
        }
      : issue,
  );
}
