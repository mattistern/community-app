/**
 * CSV export of the reports (DESIGN.md §3C: `ייצא נתונים ל-CSV`). Opens in
 * Excel with Hebrew intact (a byte-order mark) and can't be used to smuggle a
 * spreadsheet formula in through a resident's text.
 */
import { formatSortableDateTime } from "./format-time";
import type { Issue } from "./types";
import { averageRating, urgencyScore } from "./urgency";

/** Without this marker Excel reads a UTF-8 file as a legacy code page and garbles Hebrew. */
const BYTE_ORDER_MARK = "\u{FEFF}";

/** Spreadsheets run a cell that starts with one of these as a formula. */
const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Report titles and descriptions are typed by residents, so a cell like
 * `=HYPERLINK(...)` must stay plain text: a leading apostrophe does that.
 */
export function neutralizeFormula(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value;
}

/** One field per RFC 4180: quoted when it holds a comma, a quote or a line break, with quotes doubled. */
export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  return (
    BYTE_ORDER_MARK +
    rows.map((row) => row.map(csvField).join(",")).join("\r\n") +
    "\r\n"
  );
}

export const ISSUE_CSV_HEADERS = [
  "מזהה",
  "תאריך פתיחה",
  "קטגוריה",
  "כותרת",
  "תיאור",
  "מיקום",
  "טלפון המדווח",
  "סטטוס",
  "הערת הנהלה",
  "דחיפות ממוצעת",
  "מספר הצבעות",
  "ציון דחיפות משוקלל",
  "תאריך סגירה",
  "מדיה",
];

/** One report as the cells of a CSV row, in the order of ISSUE_CSV_HEADERS. */
export function issueToCsvRow(issue: Issue): string[] {
  return [
    issue.id,
    formatSortableDateTime(issue.createdAt),
    issue.category ?? "",
    issue.title,
    issue.description,
    issue.location ?? "",
    issue.authorPhone,
    issue.status,
    issue.adminNote ?? "",
    issue.voteCount === 0
      ? ""
      : averageRating(issue.ratingSum, issue.voteCount).toFixed(2),
    String(issue.voteCount),
    urgencyScore(issue).toFixed(2),
    issue.resolvedAt ? formatSortableDateTime(issue.resolvedAt) : "",
    issue.media ? "יש" : issue.mediaRemovedAt ? "נמחקה" : "אין",
  ].map(neutralizeFormula);
}

export function issuesToCsv(issues: readonly Issue[]): string {
  return toCsv([ISSUE_CSV_HEADERS, ...issues.map(issueToCsvRow)]);
}

export function csvFilename(now: number): string {
  return `reports-${new Date(now).toISOString().slice(0, 10)}.csv`;
}
