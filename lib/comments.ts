/**
 * Public comments under an issue. Pure rules; lib/local-comments keeps the data.
 * Comments show who spoke only as "הנהלה" or a resident, never a phone number.
 */
import type { WhitelistRole } from "./whitelist";

export const COMMENT_MAX_LENGTH = 500;

export interface Comment {
  id: string;
  issueId: string;
  /** Kept so "your comment" can be marked; never shown. */
  authorPhone: string;
  authorRole: WhitelistRole;
  body: string;
  /** ISO timestamp. */
  createdAt: string;
}

/** Null when the text can be posted, otherwise the Hebrew reason. */
export function validateComment(body: string): string | null {
  const text = body.trim();
  if (text === "") return "יש לכתוב תגובה לפני השליחה";
  if (text.length > COMMENT_MAX_LENGTH) {
    return `התגובה ארוכה מדי (עד ${COMMENT_MAX_LENGTH} תווים)`;
  }
  return null;
}

/** The comments of one issue, oldest first (a conversation reads top to bottom). */
export function commentsForIssue(
  comments: readonly Comment[],
  issueId: string,
): Comment[] {
  return comments
    .filter((comment) => comment.issueId === issueId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function countComments(
  comments: readonly Comment[],
  issueId: string,
): number {
  return comments.reduce(
    (total, comment) => total + (comment.issueId === issueId ? 1 : 0),
    0,
  );
}
