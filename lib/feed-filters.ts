/**
 * Search, filter pills and ordering for the resident feed (DESIGN.md §3.B).
 * Pure functions so the rules are easy to test; the Feed component only holds
 * the state. These run over the issues already loaded in the browser; once the
 * data layer pages from Supabase, the same rules should move into the query.
 */
import type { Issue, IssueCategory, IssueStatus } from "./types";
import { sortByUrgency, urgencyScore } from "./urgency";

/** Status pills, in the order DESIGN.md lists them. */
const STATUS_VIEWS = ["בתהליך", "בוצע", "נדחה"] as const satisfies readonly IssueStatus[];

/**
 * The filter pills, in display order. "דחוף ביותר" is a sort (Bayesian urgency),
 * not a filter; the status pills filter; "הדיווחים שלי" shows own reports only.
 */
export const FEED_VIEWS = ["הדיווחים שלי", "הכל", "דחוף ביותר", ...STATUS_VIEWS] as const;
export type FeedView = (typeof FEED_VIEWS)[number];

type StatusView = (typeof STATUS_VIEWS)[number];

const isStatusView = (view: FeedView): view is StatusView =>
  (STATUS_VIEWS as readonly string[]).includes(view);

export interface FeedFilters {
  view: FeedView;
  query: string;
  /** null means all categories. */
  category: IssueCategory | null;
}

export const DEFAULT_FILTERS: FeedFilters = {
  view: "הכל",
  query: "",
  category: null,
};

/** Hebrew points and cantillation marks (not maqaf, paseq, sof pasuq or nun hafukha). */
const HEBREW_MARKS = /[\u{591}-\u{5BD}\u{5BF}\u{5C1}\u{5C2}\u{5C4}\u{5C5}\u{5C7}]/gu;

const FINAL_TO_BASE: Record<string, string> = {
  "ך": "כ",
  "ם": "מ",
  "ן": "נ",
  "ף": "פ",
  "ץ": "צ",
};

/**
 * Makes Hebrew text comparable for search: strips niqqud, folds final letters
 * into their base form (so "גן" finds "גנים"), drops geresh/gershayim/quotes
 * (so "שצפ" finds שצ"פ), lowercases Latin text and collapses whitespace.
 */
export function normalizeSearchText(text: string): string {
  return text
    .replace(HEBREW_MARKS, "")
    .replace(/[ךםןףץ]/g, (letter) => FINAL_TO_BASE[letter])
    .replace(/["'\u{5F3}\u{5F4}\u{2018}\u{2019}\u{201C}\u{201D}]/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every word of the query must appear somewhere in the issue's public text, in
 * any order. The author's phone is deliberately not searchable.
 */
export function matchesQuery(issue: Issue, query: string): boolean {
  const words = normalizeSearchText(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;

  const text = normalizeSearchText(
    [issue.title, issue.description, issue.category, issue.location, issue.adminNote]
      .filter(Boolean)
      .join(" "),
  );
  return words.every((word) => text.includes(word));
}

/** Fixed urgency scores (issue id -> score) to rank from instead of live votes. */
export type UrgencySnapshot = ReadonlyMap<string, number>;

export function snapshotUrgency(issues: readonly Issue[]): UrgencySnapshot {
  return new Map(
    issues.map((issue): [string, number] => [issue.id, urgencyScore(issue)]),
  );
}

const newestFirst = (a: Issue, b: Issue) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt);

/**
 * The issues to show for the current pill, search text and category (all
 * combined with AND). Every view is newest first except "דחוף ביותר", which is
 * ranked by Bayesian urgency. Pass `urgencySnapshot` to rank from scores taken
 * earlier, so the order holds while votes change; issues missing from the
 * snapshot fall back to their live score.
 */
export function filterAndSortIssues(
  issues: readonly Issue[],
  filters: FeedFilters,
  currentUserPhone: string,
  urgencySnapshot?: UrgencySnapshot,
): Issue[] {
  const { view, query, category } = filters;

  const matching = issues.filter((issue) => {
    if (view === "הדיווחים שלי" && issue.authorPhone !== currentUserPhone) return false;
    if (isStatusView(view) && issue.status !== view) return false;
    if (category !== null && issue.category !== category) return false;
    return matchesQuery(issue, query);
  });

  if (view === "דחוף ביותר") {
    return sortByUrgency(
      matching,
      (issue) => urgencySnapshot?.get(issue.id) ?? urgencyScore(issue),
    );
  }
  return matching.sort(newestFirst);
}

/** Hebrew result count, announced to screen readers when filters change. */
export function formatResultsCount(count: number): string {
  if (count === 0) return "לא נמצאו דיווחים";
  if (count === 1) return "נמצא דיווח אחד";
  return `נמצאו ${count} דיווחים`;
}
