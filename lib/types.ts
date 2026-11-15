export const ISSUE_STATUSES = ["בהמתנה", "בתהליך", "בוצע", "נדחה"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_CATEGORIES = [
  "תשתיות וכבישים",
  "ניקיון וגינון",
  "תאורה חשמל",
  "ביטחון",
  "אחר",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export function isIssueCategory(value: string): value is IssueCategory {
  return (ISSUE_CATEGORIES as readonly string[]).includes(value);
}

export interface IssueMedia {
  type: "image" | "video";
  /** Low-res thumbnail shown in the feed. */
  thumbnailUrl: string;
  /** Full-resolution asset, loaded only on explicit tap. */
  fullUrl: string;
  alt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  category?: IssueCategory;
  location?: string;
  media?: IssueMedia;
  /** Official public note from the community admin. */
  adminNote?: string;
  /** ISO timestamp. */
  createdAt: string;
  authorPhone: string;
  /** Sum of all 1-5 urgency votes. */
  ratingSum: number;
  voteCount: number;
  /** The current user's vote, if any (1-5). */
  myVote?: number;
  /**
   * ISO timestamp of when an admin last set the status to בוצע or נדחה; cleared
   * if the status is moved back. Starts the 7-day grace period before the
   * issue's media is deleted (CLAUDE.md §3).
   */
  resolvedAt?: string;
  /** ISO timestamp of when the media was deleted after the grace period. */
  mediaRemovedAt?: string;
}
