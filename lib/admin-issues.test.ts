/** The admin dashboard's table (search, filters, sort) and the overview's numbers. */
import { describe, expect, it } from "vitest";
import {
  ADMIN_NOTE_MAX_LENGTH,
  DEFAULT_ADMIN_FILTERS,
  UNCATEGORIZED_LABEL,
  adminMatchesQuery,
  countByCategory,
  countByStatus,
  filterAndSortForAdmin,
  overviewStats,
  scheduledMediaDeletions,
  topUrgentOpen,
  validateAdminNote,
  type AdminFilters,
} from "@/lib/admin-issues";
import { makeIssue } from "@/lib/test-helpers";
import type { Issue } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-11-15T09:00:00.000Z");
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();
const photo = { type: "image" as const, thumbnailUrl: "t", fullUrl: "f", alt: "a" };

const pothole = makeIssue({
  id: "101",
  title: "בור גדול בכביש",
  description: "בור עמוק שמתמלא במים",
  status: "בתהליך",
  category: "תשתיות וכבישים",
  location: "רחוב הבנים 12",
  adminNote: "הועבר לקבלן המועצה",
  createdAt: ago(1),
  authorPhone: "054-7654321",
  ratingSum: 113,
  voteCount: 24, // urgency 4.41
});
const lamp = makeIssue({
  id: "102",
  title: "פנס רחוב כבוי",
  status: "בהמתנה",
  category: "תאורה חשמל",
  createdAt: ago(0.1),
  authorPhone: "052-1234567",
  ratingSum: 9,
  voteCount: 2, // 3.43
});
const trees = makeIssue({
  id: "103",
  title: "גיזום עצים בגינה",
  status: "בוצע",
  category: "ניקיון וגינון",
  createdAt: ago(5),
  resolvedAt: ago(3),
  media: photo,
  authorPhone: "050-1112233",
  ratingSum: 34,
  voteCount: 11, // 3.06
});
const gate = makeIssue({
  id: "104",
  title: "שער פתוח בלילות",
  status: "בהמתנה",
  category: "ביטחון",
  createdAt: ago(2),
  authorPhone: "053-9998877",
  ratingSum: 14,
  voteCount: 3, // 3.63
});
const bench = makeIssue({
  id: "105",
  title: "ספסל בתחנה",
  status: "נדחה",
  category: "אחר",
  createdAt: ago(7),
  resolvedAt: ago(6),
  authorPhone: "052-1234567",
  ratingSum: 16,
  voteCount: 6, // 2.82
});
const plain = makeIssue({
  id: "106",
  title: "נושא כללי",
  status: "בהמתנה",
  createdAt: ago(3),
  authorPhone: "058-0000001",
  ratingSum: 0,
  voteCount: 0, // 3.00
});
const ISSUES = [pothole, lamp, trees, gate, bench, plain];

const ids = (issues: readonly Issue[]) => issues.map((i) => i.id);
const show = (filters: Partial<AdminFilters> = {}) =>
  ids(filterAndSortForAdmin(ISSUES, { ...DEFAULT_ADMIN_FILTERS, ...filters }));

describe("adminMatchesQuery", () => {
  it("matches everything for an empty search", () => {
    expect(adminMatchesQuery(pothole, "")).toBe(true);
    expect(adminMatchesQuery(pothole, "   ")).toBe(true);
  });

  it("finds a report by its id, with or without a #", () => {
    expect(adminMatchesQuery(pothole, "101")).toBe(true);
    expect(adminMatchesQuery(pothole, "#101")).toBe(true);
    expect(adminMatchesQuery(pothole, "#102")).toBe(false);
  });

  it("finds a report by the reporter's phone (admins may), dash or not, even partial", () => {
    expect(adminMatchesQuery(pothole, "054-7654321")).toBe(true);
    expect(adminMatchesQuery(pothole, "0547654321")).toBe(true);
    expect(adminMatchesQuery(pothole, "054765")).toBe(true);
    expect(adminMatchesQuery(pothole, "052")).toBe(false);
  });

  it("finds text in the title, description, location and official note", () => {
    for (const query of ["גדול", "מתמלא", "הבנים", "קבלן"]) {
      expect(adminMatchesQuery(pothole, query)).toBe(true);
    }
  });

  it("needs every word", () => {
    expect(adminMatchesQuery(pothole, "בור קבלן")).toBe(true);
    expect(adminMatchesQuery(pothole, "בור ספסל")).toBe(false);
  });

  it("is Hebrew-aware like the residents' search", () => {
    expect(adminMatchesQuery(makeIssue({ title: "גנים ציבוריים" }), "גן")).toBe(true);
  });
});

describe("filterAndSortForAdmin", () => {
  it("shows everything, newest first, by default", () => {
    expect(show()).toEqual(["102", "101", "104", "106", "103", "105"]);
  });

  it("filters by status", () => {
    expect(show({ status: "בהמתנה" })).toEqual(["102", "104", "106"]);
    expect(show({ status: "בוצע" })).toEqual(["103"]);
    expect(show({ status: "נדחה" })).toEqual(["105"]);
  });

  it("filters by category (reports without one only appear under 'all')", () => {
    expect(show({ category: "ביטחון" })).toEqual(["104"]);
    expect(show({ category: "all" })).toContain("106");
    expect(show({ category: "תאורה חשמל" })).not.toContain("106");
  });

  it("combines status, category and search", () => {
    expect(show({ status: "בהמתנה", category: "ביטחון" })).toEqual(["104"]);
    expect(show({ status: "בתהליך", query: "קבלן" })).toEqual(["101"]);
    expect(show({ status: "בוצע", query: "קבלן" })).toEqual([]);
    expect(show({ query: "052" })).toEqual(["102", "105"]);
  });

  it("sorts oldest first", () => {
    expect(show({ sort: "oldest" })).toEqual(["105", "103", "106", "104", "101", "102"]);
  });

  it("sorts by weighted urgency, most urgent first", () => {
    // 4.41 > 3.63 > 3.43 > 3.06 > 3.00 > 2.82
    expect(show({ sort: "urgency" })).toEqual(["101", "104", "102", "103", "106", "105"]);
  });

  it("breaks urgency ties with the newer report first", () => {
    const a = makeIssue({ id: "a", createdAt: ago(5), ratingSum: 0, voteCount: 0 });
    const b = makeIssue({ id: "b", createdAt: ago(1), ratingSum: 0, voteCount: 0 });

    const sorted = filterAndSortForAdmin([a, b], { ...DEFAULT_ADMIN_FILTERS, sort: "urgency" });

    expect(ids(sorted)).toEqual(["b", "a"]);
  });

  it("leaves its input untouched", () => {
    const input: readonly Issue[] = Object.freeze([...ISSUES]);
    const before = [...input];

    filterAndSortForAdmin(input, { ...DEFAULT_ADMIN_FILTERS, sort: "urgency" });

    expect([...input]).toEqual(before);
  });
});

describe("overview numbers", () => {
  it("counts reports per status, including statuses with none", () => {
    expect(countByStatus(ISSUES)).toEqual({ בהמתנה: 3, בתהליך: 1, בוצע: 1, נדחה: 1 });
    expect(countByStatus([])).toEqual({ בהמתנה: 0, בתהליך: 0, בוצע: 0, נדחה: 0 });
  });

  it("ranks categories by count, with equal counts in the usual order", () => {
    const issues = [
      pothole,
      makeIssue({ id: "x", category: "תשתיות וכבישים" }),
      lamp,
    ];

    expect(countByCategory(issues)).toEqual([
      { category: "תשתיות וכבישים", count: 2 },
      { category: "תאורה חשמל", count: 1 },
      { category: "ניקיון וגינון", count: 0 },
      { category: "ביטחון", count: 0 },
      { category: "אחר", count: 0 },
    ]);
  });

  it("adds a 'no category' row only when some report has none, ranked like any other row", () => {
    expect(countByCategory([pothole]).some((row) => row.category === UNCATEGORIZED_LABEL)).toBe(false);
    expect(countByCategory([pothole, plain])).toEqual([
      { category: "תשתיות וכבישים", count: 1 },
      { category: UNCATEGORIZED_LABEL, count: 1 },
      { category: "ניקיון וגינון", count: 0 },
      { category: "תאורה חשמל", count: 0 },
      { category: "ביטחון", count: 0 },
      { category: "אחר", count: 0 },
    ]);
  });

  it("lists the most urgent reports that are still open", () => {
    // open: 101 (4.41), 104 (3.63), 102 (3.43), 106 (3.00); resolved ones never appear
    expect(ids(topUrgentOpen(ISSUES, 3))).toEqual(["101", "104", "102"]);
    expect(ids(topUrgentOpen(ISSUES, 10))).toEqual(["101", "104", "102", "106"]);
  });

  it("lists photos waiting out the grace period, soonest first", () => {
    const soon = makeIssue({ id: "soon", status: "נדחה", resolvedAt: ago(6), media: photo });

    const scheduled = scheduledMediaDeletions([trees, soon, pothole, bench], NOW);

    expect(scheduled.map((s) => s.issue.id)).toEqual(["soon", "103"]);
    expect(scheduled.map((s) => s.msLeft)).toEqual([1 * DAY, 4 * DAY]);
  });

  it("summarizes the reports", () => {
    expect(overviewStats(ISSUES, NOW)).toEqual({
      total: 6,
      open: 4,
      pending: 3,
      inProgress: 1,
      done: 1,
      rejected: 1,
      newThisWeek: 6,
    });
  });

  it("counts 'new this week' as the last 7 days, boundary included, never the real future", () => {
    const at = (offset: number) => makeIssue({ createdAt: new Date(NOW - offset).toISOString() });

    const stats = overviewStats(
      [at(7 * DAY), at(7 * DAY + 1), at(0), at(-61_000), at(-DAY)],
      NOW,
    );

    expect(stats.newThisWeek).toBe(2);
  });

  it("counts a report made seconds ago even though the minute clock is behind it", () => {
    const justNow = makeIssue({ createdAt: new Date(NOW + 45_000).toISOString() });

    expect(overviewStats([justNow], NOW).newThisWeek).toBe(1);
    // A full minute ahead is a wrong clock, not rounding.
    const ahead = makeIssue({ createdAt: new Date(NOW + 61_000).toISOString() });
    expect(overviewStats([ahead], NOW).newThisWeek).toBe(0);
  });
});

describe("validateAdminNote", () => {
  it("accepts up to the limit and refuses one more", () => {
    expect(validateAdminNote("א".repeat(ADMIN_NOTE_MAX_LENGTH))).toBeNull();
    expect(validateAdminNote("א".repeat(ADMIN_NOTE_MAX_LENGTH + 1))).toContain(`עד ${ADMIN_NOTE_MAX_LENGTH} תווים`);
  });

  it("measures the trimmed text, and allows an empty note (it removes the note)", () => {
    expect(validateAdminNote(`  ${"א".repeat(ADMIN_NOTE_MAX_LENGTH)}  `)).toBeNull();
    expect(validateAdminNote("")).toBeNull();
  });
});
