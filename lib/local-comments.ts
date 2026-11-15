/**
 * Comments on issues, kept in this browser's localStorage like the rest of the
 * prototype's data (nothing leaves the device).
 */
import { validateComment, type Comment } from "./comments";
import { getIssues } from "./local-issues";
import { createPersistedStore } from "./persisted-store";
import type { WhitelistRole } from "./whitelist";

const store = createPersistedStore<Comment[]>({
  key: "community-app:comments",
  version: 1,
  seed: () => [],
  // Comments whose issue no longer exists must not linger: a new issue can be
  // given a deleted one's id, and would inherit them.
  onLoad: (comments) => {
    const live = new Set(getIssues().map((issue) => issue.id));
    const kept = comments.filter((comment) => live.has(comment.issueId));
    return kept.length === comments.length ? comments : kept;
  },
});

/** The comments, or null until the browser has loaded them (and on the server). */
export const useComments = store.useValue;

/**
 * Adds a comment. Stands in for the server, so it re-checks the text itself.
 * @throws Error with a Hebrew message when the text is not allowed
 * @throws StorageFullError (from the store) when the browser has no room left
 */
export function addComment(
  issueId: string,
  body: string,
  author: { phone: string; role: WhitelistRole },
  now: number = Date.now(),
): Comment {
  const problem = validateComment(body);
  if (problem) throw new Error(problem);

  const comment: Comment = {
    // crypto.randomUUID is missing on http LAN addresses, so build the id by hand.
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    issueId,
    authorPhone: author.phone,
    authorRole: author.role,
    body: body.trim(),
    createdAt: new Date(now).toISOString(),
  };
  store.set([...store.get(), comment], { strict: true });
  return comment;
}

/** Removes (and returns) every comment on the given issues, e.g. when they are deleted. */
export function takeCommentsForIssues(issueIds: readonly string[]): Comment[] {
  const ids = new Set(issueIds);
  const all = store.get();
  const taken = all.filter((comment) => ids.has(comment.issueId));
  if (taken.length > 0) store.set(all.filter((comment) => !ids.has(comment.issueId)));
  return taken;
}

/** Puts comments back (the admin's undo of a deletion). */
export function restoreComments(taken: readonly Comment[]): void {
  if (taken.length > 0) store.set([...store.get(), ...taken]);
}

/** Demo: removes every comment. */
export function resetComments(): void {
  store.set([]);
}
