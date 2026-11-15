/**
 * What the admin dashboard shows: the issues table's search, filters and sort,
 * and the numbers on the overview. Pure functions, like the residents' feed
 * rules in lib/feed-filters.
 */
import { normalizeSearchText } from "./feed-filters";
import { msUntilMediaDeletion } from "./media-cleanup";
import {
  ISSUE_CATEGORIES,
  ISSUE_STATUSES,
  type Issue,
  type IssueCategory,
  type IssueStatus,
} from "./types";
import { urgencyScore } from "./urgency";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The official note on a card is meant to be short (CLAUDE.md §3). */
export const ADMIN_NOTE_MAX_LENGTH = 200;

export function validateAdminNote(note: string): string | null {
  return note.trim().length > ADMIN_NOTE_MAX_LENGTH
    ? `ההערה ארוכה מדי (עד ${ADMIN_NOTE_MAX_LENGTH} תווים)`
    : null;
}

export type AdminSort = "newest" | "oldest" | "urgency";

export const ADMIN_SORTS: readonly { value: AdminSort; label: string }[] = [
  { value: "newest", label: "החדשות ביותר" },
  { value: "oldest", label: "הישנות ביותר" },
  { value: "urgency", label: "הדחופות ביותר" },
];

export interface AdminFilters {
  status: IssueStatus | "all";
  category: IssueCategory | "all";
  query: string;
  sort: AdminSort;
}

export const DEFAULT_ADMIN_FILTERS: AdminFilters = {
  status: "all",
  category: "all",
  query: "",
  sort: "newest",
};

/**
 * Every word must appear in the report's id, text, category, location, admin
 * note or reporter's phone. Admins (unlike residents) may search by phone, with
 * or without the dash; "#101" finds report 101.
 */
export function adminMatchesQuery(issue: Issue, query: string): boolean {
  const words = normalizeSearchText(query)
    .split(" ")
    .map((word) => word.replace(/^#/, ""))
    .filter(Boolean);
  if (words.length === 0) return true;

  const text =
    normalizeSearchText(
      [
        issue.id,
        issue.title,
        issue.description,
        issue.category,
        issue.location,
        issue.adminNote,
        issue.authorPhone,
      ]
        .filter(Boolean)
        .join(" "),
    ) + ` ${issue.authorPhone.replace(/\D/g, "")}`;
  return words.every((word) => text.includes(word));
}

/** The issues the table shows for the current status, category, search and sort. */
export function filterAndSortForAdmin(
  issues: readonly Issue[],
  filters: AdminFilters,
): Issue[] {
  const matching = issues.filter(
    (issue) =>
      (filters.status === "all" || issue.status === filters.status) &&
      (filters.category === "all" || issue.category === filters.category) &&
      adminMatchesQuery(issue, filters.query),
  );

  const created = (issue: Issue) => Date.parse(issue.createdAt);
  switch (filters.sort) {
    case "oldest":
      return matching.sort((a, b) => created(a) - created(b));
    case "urgency":
      return matching.sort(
        (a, b) => urgencyScore(b) - urgencyScore(a) || created(b) - created(a),
      );
    default:
      return matching.sort((a, b) => created(b) - created(a));
  }
}

export function countByStatus(
  issues: readonly Issue[],
): Record<IssueStatus, number> {
  const counts = Object.fromEntries(
    ISSUE_STATUSES.map((status) => [status, 0]),
  ) as Record<IssueStatus, number>;
  for (const issue of issues) counts[issue.status] += 1;
  return counts;
}

export const UNCATEGORIZED_LABEL = "ללא קטגוריה";

/** Issues per category, most first (ties keep the usual category order); "no category" only appears when there are such issues. */
export function countByCategory(
  issues: readonly Issue[],
): { category: string; count: number }[] {
  const counts = new Map<string, number>(
    ISSUE_CATEGORIES.map((category) => [category, 0]),
  );
  let uncategorized = 0;
  for (const issue of issues) {
    if (issue.category) {
      counts.set(issue.category, (counts.get(issue.category) ?? 0) + 1);
    } else {
      uncategorized += 1;
    }
  }
  const rows = [...counts].map(([category, count]) => ({ category, count }));
  if (uncategorized > 0) {
    rows.push({ category: UNCATEGORIZED_LABEL, count: uncategorized });
  }
  // Array.sort is stable, so equal counts stay in category order.
  return rows.sort((a, b) => b.count - a.count);
}

const isOpen = (issue: Issue) =>
  issue.status === "בהמתנה" || issue.status === "בתהליך";

/** The most urgent reports that are still open (pending or in progress). */
export function topUrgentOpen(issues: readonly Issue[], limit: number): Issue[] {
  return issues
    .filter(isOpen)
    .sort(
      (a, b) =>
        urgencyScore(b) - urgencyScore(a) ||
        Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )
    .slice(0, limit);
}

/** Resolved reports whose photo is waiting out the 7-day grace period, soonest deletion first. */
export function scheduledMediaDeletions(
  issues: readonly Issue[],
  now: number,
): { issue: Issue; msLeft: number }[] {
  const scheduled: { issue: Issue; msLeft: number }[] = [];
  for (const issue of issues) {
    const msLeft = msUntilMediaDeletion(issue, now);
    if (msLeft !== null) scheduled.push({ issue, msLeft });
  }
  return scheduled.sort((a, b) => a.msLeft - b.msLeft);
}

/** The clock behind `now` rounds down to the minute, so a report made seconds ago can look up to a minute "in the future". */
const CLOCK_SLACK_MS = 60_000;

export interface OverviewStats {
  total: number;
  /** Pending plus in progress. */
  open: number;
  pending: number;
  inProgress: number;
  done: number;
  rejected: number;
  /** Opened in the last 7 days. */
  newThisWeek: number;
}

export function overviewStats(
  issues: readonly Issue[],
  now: number,
): OverviewStats {
  const byStatus = countByStatus(issues);
  return {
    total: issues.length,
    open: byStatus["בהמתנה"] + byStatus["בתהליך"],
    pending: byStatus["בהמתנה"],
    inProgress: byStatus["בתהליך"],
    done: byStatus["בוצע"],
    rejected: byStatus["נדחה"],
    newThisWeek: issues.filter((issue) => {
      const age = now - Date.parse(issue.createdAt);
      return age >= -CLOCK_SLACK_MS && age <= 7 * DAY_MS;
    }).length,
  };
}
