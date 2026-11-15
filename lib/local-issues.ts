/**
 * Local-first data layer for the prototype: every issue lives in this browser's
 * localStorage (seeded with demo data on first run) and is shared with React via
 * useSyncExternalStore. Nothing leaves the device, and the phone and the PC each
 * keep their own copy. When a real backend arrives, this module is what gets
 * replaced; the components only use the functions exported here, for residents
 * (reporting, voting) and for admins (statuses, notes, deleting, the cleanup).
 */
import {
  isResolvedStatus,
  shiftResolvedTimes,
  sweepExpiredMedia,
  withStatus,
} from "./media-cleanup";
import { createSeedIssues } from "./mock-issues";
import {
  CooldownError,
  buildIssue,
  cooldownRemainingMs,
  nextIssueId,
  type NewIssueInput,
} from "./new-issue";
import { createPersistedStore } from "./persisted-store";
import type { Issue, IssueStatus } from "./types";
import { applyVote } from "./urgency";

export { StorageFullError } from "./persisted-store";

const LAST_POST_KEY_PREFIX = "community-app:last-post:";

/**
 * Version 2 added the media lifecycle fields. Data saved by version 1 is kept
 * (reports a tester created survive): issues that were already resolved are
 * stamped as resolved when they were created, the closest thing the old data knows.
 */
function migrateIssues(
  stored: unknown,
  fromVersion: number | undefined,
): Issue[] | null {
  const legacy = (stored as { issues?: unknown } | null)?.issues;
  if (fromVersion !== 1 || !Array.isArray(legacy)) return null;
  return (legacy as Issue[]).map((issue) =>
    isResolvedStatus(issue.status) && !issue.resolvedAt
      ? { ...issue, resolvedAt: issue.createdAt }
      : issue,
  );
}

const store = createPersistedStore<Issue[]>({
  key: "community-app:issues",
  version: 2,
  seed: () => createSeedIssues(Date.now()),
  migrate: migrateIssues,
  // Stands in for the scheduled cleanup job: whatever is past its grace period loses its media.
  onLoad: (issues) => sweepExpiredMedia(issues, Date.now()).issues,
});

/** The issues, or null until the browser has loaded them (and on the server). */
export const useIssues = store.useValue;

/** Client only. */
export const getIssues = store.get;

/** Votes are tiny, so a failed save never blocks them. */
export function voteOnIssue(issueId: string, value: number): void {
  store.set(
    getIssues().map((issue) =>
      issue.id === issueId ? applyVote(issue, value) : issue,
    ),
  );
}

export function getLastPostAt(phone: string): number | null {
  try {
    const raw = window.localStorage.getItem(LAST_POST_KEY_PREFIX + phone);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function recordPost(phone: string, at: number): void {
  try {
    window.localStorage.setItem(LAST_POST_KEY_PREFIX + phone, String(at));
  } catch {
    // Without storage the cooldown simply can't be remembered across reloads.
  }
}

/** Demo helper: lets a resident post again right away. */
export function clearLastPostAt(phone: string): void {
  try {
    window.localStorage.removeItem(LAST_POST_KEY_PREFIX + phone);
  } catch {
    // Nothing to clear.
  }
}

/**
 * Publishes a new issue at the top of the feed. Stands in for the server: it
 * enforces the post cooldown itself (so skipping the form's check doesn't
 * help) and saves strictly.
 * @throws CooldownError when the resident posted less than a minute ago
 * @throws StorageFullError when the browser has no storage left
 */
export function createIssue(
  input: NewIssueInput,
  authorPhone: string,
  now: number = Date.now(),
): Issue {
  const remaining = cooldownRemainingMs(getLastPostAt(authorPhone), now);
  if (remaining > 0) throw new CooldownError(remaining);

  const issues = getIssues();
  const issue = buildIssue(input, {
    id: nextIssueId(issues),
    now,
    authorPhone,
  });
  store.set([issue, ...issues], { strict: true });
  recordPost(authorPhone, now);
  return issue;
}

// ---- Admin operations ----

/** Applies `change` to every issue, saving only if something actually changed. */
function updateIssues(change: (issue: Issue) => Issue): void {
  const issues = getIssues();
  const next = issues.map(change);
  if (next.some((issue, index) => issue !== issues[index])) store.set(next);
}

/** Changes one issue's status; resolving it starts the 7-day media grace period, moving it back cancels it. */
export function setIssueStatus(
  issueId: string,
  status: IssueStatus,
  now: number = Date.now(),
): void {
  updateIssues((issue) =>
    issue.id === issueId ? withStatus(issue, status, now) : issue,
  );
}

/** The same status change for several issues at once. */
export function setIssuesStatus(
  issueIds: readonly string[],
  status: IssueStatus,
  now: number = Date.now(),
): void {
  const ids = new Set(issueIds);
  updateIssues((issue) => (ids.has(issue.id) ? withStatus(issue, status, now) : issue));
}

/** Sets the public admin note (הערת הנהלה רשמית); blank removes it. */
export function setAdminNote(issueId: string, note: string): void {
  const adminNote = note.trim() || undefined;
  updateIssues((issue) =>
    issue.id === issueId && issue.adminNote !== adminNote
      ? { ...issue, adminNote }
      : issue,
  );
}

/** Deletes issues and returns them, so the admin can undo. */
export function deleteIssues(issueIds: readonly string[]): Issue[] {
  const ids = new Set(issueIds);
  const issues = getIssues();
  const removed = issues.filter((issue) => ids.has(issue.id));
  if (removed.length > 0) {
    store.set(issues.filter((issue) => !ids.has(issue.id)));
  }
  return removed;
}

/** Puts deleted issues back (the admin's undo); any whose id has since been taken is skipped. */
export function restoreIssues(removed: readonly Issue[]): void {
  const issues = getIssues();
  const taken = new Set(issues.map((issue) => issue.id));
  const back = removed.filter((issue) => !taken.has(issue.id));
  if (back.length > 0) store.set([...issues, ...back]);
}

/** Runs the media cleanup now; returns how many issues lost their media. */
export function sweepMedia(now: number = Date.now()): number {
  const { issues, removedFrom } = sweepExpiredMedia(getIssues(), now);
  if (removedFrom.length > 0) store.set(issues);
  return removedFrom.length;
}

/** Demo: pretend `ms` has passed for every resolved issue, then run the cleanup. */
export function fastForwardResolved(
  ms: number,
  now: number = Date.now(),
): number {
  store.set(shiftResolvedTimes(getIssues(), ms));
  return sweepMedia(now);
}

/** Demo: back to the starting demo issues, with every posting cooldown cleared. */
export function resetDemoIssues(now: number = Date.now()): void {
  store.set(createSeedIssues(now));
  try {
    const storage = window.localStorage;
    for (let index = storage.length - 1; index >= 0; index--) {
      const key = storage.key(index);
      if (key?.startsWith(LAST_POST_KEY_PREFIX)) storage.removeItem(key);
    }
  } catch {
    // Nothing to clear.
  }
}
