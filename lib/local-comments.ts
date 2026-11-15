/**
 * Comments on issues, kept in this browser's localStorage like the rest of the
 * prototype's data (nothing leaves the device).
 */
import { validateComment, type Comment } from "./comments";
import { createPersistedStore } from "./persisted-store";
import type { WhitelistRole } from "./whitelist";

const store = createPersistedStore<Comment[]>({
  key: "community-app:comments",
  version: 1,
  seed: () => [],
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
