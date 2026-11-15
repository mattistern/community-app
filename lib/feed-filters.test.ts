/**
 * Search, filter pills and ordering for the resident feed (DESIGN.md §3.B):
 * the pill rules, Hebrew-aware search, and how the three controls combine.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  FEED_VIEWS,
  filterAndSortIssues,
  formatResultsCount,
  matchesQuery,
  normalizeSearchText,
  snapshotUrgency,
  type FeedFilters,
  type UrgencySnapshot,
} from "@/lib/feed-filters";
import { makeIssue } from "@/lib/test-helpers";
import type { Issue } from "@/lib/types";
import { applyVote } from "@/lib/urgency";

const ME = "052-1234567";

// Hand-built fixtures (same shapes as the mock data), deliberately out of date order.
const pothole = makeIssue({
  id: "pothole",
  title: "בור גדול בכביש ליד הכניסה לגן הילדים",
  description: "בור עמוק שמתמלא במים בכל גשם",
  status: "בתהליך",
  category: "תשתיות וכבישים",
  location: "רחוב הבנים 12",
  adminNote: "הועבר לקבלן המועצה, צפי לתיקון עד סוף השבוע",
  createdAt: "2026-11-14T08:30:00.000Z",
  authorPhone: "054-7654321",
  ratingSum: 113,
  voteCount: 24, // urgency 4.41
});
const streetlight = makeIssue({
  id: "streetlight",
  title: "פנס רחוב לא עובד כבר שבועיים",
  description: "הפנס בפינת הרחוב כבוי והקטע חשוך בלילה",
  status: "בהמתנה",
  category: "תאורה חשמל",
  location: "רחוב הזית 4",
  createdAt: "2026-11-15T06:10:00.000Z",
  authorPhone: ME,
  ratingSum: 9,
  voteCount: 2, // 3.43
});
const trees = makeIssue({
  id: "trees",
  title: "גיזום עצים בגינה הציבורית",
  description: "ענפים נמוכים חוסמים את השביל",
  status: "בוצע",
  category: "ניקיון וגינון",
  adminNote: "הגיזום בוצע ביום ראשון. תודה על הדיווח!",
  createdAt: "2026-11-10T15:45:00.000Z",
  authorPhone: "050-1112233",
  ratingSum: 34,
  voteCount: 11, // 3.06
});
const gate = makeIssue({
  id: "gate",
  title: "שער הכניסה הצפוני נשאר פתוח בלילות",
  description: "השער לא נסגר אוטומטית אחרי 22:00",
  status: "בהמתנה",
  category: "ביטחון",
  createdAt: "2026-11-13T21:20:00.000Z",
  authorPhone: "053-9998877",
  ratingSum: 14,
  voteCount: 3, // 3.63
});
const bench = makeIssue({
  id: "bench",
  title: "בקשה להוספת ספסל בתחנת האוטובוס",
  description: "קשישים ממתינים בעמידה",
  status: "נדחה",
  category: "אחר",
  adminNote: "הפנייה הועברה למשרד התחבורה",
  createdAt: "2026-11-08T10:00:00.000Z",
  authorPhone: ME,
  ratingSum: 16,
  voteCount: 6, // 2.82
});
const ISSUES = [pothole, streetlight, trees, gate, bench];

const ids = (issues: readonly Issue[]) => issues.map((issue) => issue.id);

/** Ids shown for the given filters (defaults: "הכל", no search, all categories). */
const show = (
  filters: Partial<FeedFilters> = {},
  issues: readonly Issue[] = ISSUES,
  snapshot?: UrgencySnapshot,
) => ids(filterAndSortIssues(issues, { ...DEFAULT_FILTERS, ...filters }, ME, snapshot));

describe("FEED_VIEWS", () => {
  it("lists the pills in the order DESIGN.md gives them", () => {
    expect([...FEED_VIEWS]).toEqual([
      "הדיווחים שלי",
      "הכל",
      "דחוף ביותר",
      "בתהליך",
      "בוצע",
      "נדחה",
    ]);
  });

  it('starts on "הכל" with no search and all categories', () => {
    expect(DEFAULT_FILTERS).toEqual({ view: "הכל", query: "", category: null });
  });
});

describe("normalizeSearchText", () => {
  it("folds final letters into their base form", () => {
    expect(normalizeSearchText("גן")).toBe("גנ");
    expect(normalizeSearchText("ךםןףץ")).toBe("כמנפצ");
    expect(normalizeSearchText("גנים")).toContain(normalizeSearchText("גן"));
  });

  it("strips niqqud and cantillation marks", () => {
    // ב + dagesh + ו + holam + ר
    expect(normalizeSearchText("\u{5D1}\u{5BC}\u{5D5}\u{5B9}\u{5E8}")).toBe("בור");
  });

  it("ignores quotes, geresh and gershayim inside acronyms", () => {
    expect(normalizeSearchText('שצ"פ')).toBe("שצפ");
    expect(normalizeSearchText("שצ\u{5F4}פ")).toBe("שצפ");
    expect(normalizeSearchText("ביה\u{201D}ס")).toBe("ביהס");
  });

  it("lowercases Latin text and collapses whitespace", () => {
    expect(normalizeSearchText("  WiFi   בבית \n ")).toBe("wifi בבית");
  });
});

describe("matchesQuery", () => {
  it("matches everything for an empty or blank query", () => {
    expect(matchesQuery(pothole, "")).toBe(true);
    expect(matchesQuery(pothole, "   ")).toBe(true);
  });

  it.each([
    ["title", "פנס"],
    ["description", "חשוך"],
    ["category", "תאורה"],
    ["location", "הזית"],
  ])("finds text in the %s", (_field, query) => {
    expect(matchesQuery(streetlight, query)).toBe(true);
  });

  it("finds text in the official admin note", () => {
    expect(matchesQuery(pothole, "קבלן")).toBe(true);
  });

  it("needs every word, in any order", () => {
    expect(matchesQuery(pothole, "בור הבנים")).toBe(true); // title + location
    expect(matchesQuery(pothole, "הבנים בור")).toBe(true);
    expect(matchesQuery(pothole, "בור זית")).toBe(false); // "זית" is not in this issue
  });

  it("does not match unrelated text", () => {
    expect(matchesQuery(pothole, "ספסל")).toBe(false);
  });

  it("treats final and regular letters alike, so a stem finds its plural", () => {
    const issue = makeIssue({ title: "גנים ציבוריים מוזנחים" });
    expect(matchesQuery(issue, "גן")).toBe(true);
    expect(matchesQuery(makeIssue({ title: "גן משחקים" }), "גנים")).toBe(false); // not a substring
  });

  it("matches acronyms with or without quotes", () => {
    const issue = makeIssue({ title: 'שצ"פ מוזנח ליד הבית' });
    expect(matchesQuery(issue, "שצפ")).toBe(true);
    expect(matchesQuery(issue, 'שצ"פ')).toBe(true);
    expect(matchesQuery(makeIssue({ title: "שצפ מוזנח" }), 'שצ"פ')).toBe(true);
  });

  it("never matches on the author's phone number", () => {
    expect(matchesQuery(streetlight, "052")).toBe(false);
    expect(matchesQuery(streetlight, ME)).toBe(false);
    expect(matchesQuery(streetlight, "1234567")).toBe(false);
  });
});

describe("filterAndSortIssues: pills", () => {
  it('"הכל" shows every issue, newest first', () => {
    expect(show()).toEqual(["streetlight", "pothole", "gate", "trees", "bench"]);
  });

  it('"הדיווחים שלי" shows only the current user\'s reports, newest first', () => {
    expect(show({ view: "הדיווחים שלי" })).toEqual(["streetlight", "bench"]);
  });

  it("identifies the user by phone, so another phone sees its own reports", () => {
    const others = filterAndSortIssues(
      ISSUES,
      { ...DEFAULT_FILTERS, view: "הדיווחים שלי" },
      "054-7654321",
    );
    expect(ids(others)).toEqual(["pothole"]);
  });

  it("shows nothing under \"הדיווחים שלי\" for a user with no reports", () => {
    const none = filterAndSortIssues(
      ISSUES,
      { ...DEFAULT_FILTERS, view: "הדיווחים שלי" },
      "059-0000000",
    );
    expect(none).toEqual([]);
  });

  it.each([
    ["בתהליך", ["pothole"]],
    ["בוצע", ["trees"]],
    ["נדחה", ["bench"]],
  ] as const)("status pill %s shows only that status", (view, expected) => {
    expect(show({ view })).toEqual(expected);
  });

  it('"דחוף ביותר" keeps every issue and ranks by Bayesian urgency', () => {
    // pothole 4.41 > gate 3.63 > streetlight 3.43 > trees 3.06 > bench 2.82
    expect(show({ view: "דחוף ביותר" })).toEqual([
      "pothole",
      "gate",
      "streetlight",
      "trees",
      "bench",
    ]);
  });

  it("goes back to newest first when leaving the urgent view", () => {
    expect(show({ view: "דחוף ביותר" })).not.toEqual(show({ view: "הכל" }));
    expect(show({ view: "הכל" })).toEqual(["streetlight", "pothole", "gate", "trees", "bench"]);
  });
});

describe("filterAndSortIssues: urgent ranking snapshot", () => {
  // The resident votes 1 on the gate: live urgency drops from 3.63 to 3.33,
  // below the streetlight's 3.43.
  const snapshot = snapshotUrgency(ISSUES);
  const afterVote = ISSUES.map((issue) => (issue.id === "gate" ? applyVote(issue, 1) : issue));

  it("re-ranks from live votes when there is no snapshot", () => {
    expect(show({ view: "דחוף ביותר" }, afterVote)).toEqual([
      "pothole",
      "streetlight",
      "gate",
      "trees",
      "bench",
    ]);
  });

  it("holds the order of the snapshot while votes change", () => {
    expect(show({ view: "דחוף ביותר" }, afterVote, snapshot)).toEqual([
      "pothole",
      "gate",
      "streetlight",
      "trees",
      "bench",
    ]);
  });

  it("ranks issues missing from the snapshot by their live score", () => {
    const fresh = makeIssue({
      id: "fresh",
      createdAt: "2026-11-15T09:00:00.000Z",
      ratingSum: 50,
      voteCount: 10, // 4.33: between pothole 4.41 and gate 3.63
    });

    expect(show({ view: "דחוף ביותר" }, [...ISSUES, fresh], snapshot)).toEqual([
      "pothole",
      "fresh",
      "gate",
      "streetlight",
      "trees",
      "bench",
    ]);
  });

  it("does not affect the other views", () => {
    expect(show({ view: "הכל" }, afterVote, snapshot)).toEqual(show({ view: "הכל" }, afterVote));
  });
});

describe("snapshotUrgency", () => {
  it("records each issue's Bayesian score by id", () => {
    const snapshot = snapshotUrgency(ISSUES);

    expect(snapshot.size).toBe(5);
    expect(snapshot.get("pothole")).toBeCloseTo((113 + 5 * 3) / (24 + 5), 10);
    expect(snapshot.get("bench")).toBeCloseTo((16 + 5 * 3) / (6 + 5), 10);
  });
});

describe("filterAndSortIssues: category", () => {
  it("shows only issues in the chosen category", () => {
    expect(show({ category: "תאורה חשמל" })).toEqual(["streetlight"]);
    expect(show({ category: "אחר" })).toEqual(["bench"]);
  });

  it("leaves out issues with no category once one is chosen, but keeps them for all categories", () => {
    const uncategorized = makeIssue({ id: "uncategorized", createdAt: "2026-11-12T10:00:00.000Z" });
    const issues = [...ISSUES, uncategorized];

    expect(show({ category: "ביטחון" }, issues)).toEqual(["gate"]);
    expect(show({ category: null }, issues)).toContain("uncategorized");
  });
});

describe("filterAndSortIssues: search", () => {
  it("narrows the list to matching issues, still newest first", () => {
    expect(show({ query: "רחוב" })).toEqual(["streetlight", "pothole"]);
  });

  it("returns nothing when no issue matches", () => {
    expect(show({ query: "אין כזה דבר" })).toEqual([]);
  });

  it("is not thrown off by case, niqqud, or stray spaces", () => {
    expect(show({ query: "  פנס  " })).toEqual(["streetlight"]);
  });
});

describe("filterAndSortIssues: combining controls", () => {
  it("applies the pill, category and search together (AND)", () => {
    expect(show({ view: "הדיווחים שלי", category: "אחר" })).toEqual(["bench"]);
    expect(show({ view: "בתהליך", query: "הבנים" })).toEqual(["pothole"]);
    expect(show({ view: "בתהליך", category: "תשתיות וכבישים", query: "בור" })).toEqual(["pothole"]);
    expect(show({ view: "בתהליך", category: "ביטחון" })).toEqual([]);
    expect(show({ view: "בוצע", query: "ספסל" })).toEqual([]);
  });

  it("ranks the search results by urgency in the urgent view", () => {
    expect(show({ view: "דחוף ביותר", query: "רחוב" })).toEqual(["pothole", "streetlight"]);
  });

  it("returns a new array and leaves the input untouched", () => {
    const input: readonly Issue[] = Object.freeze([...ISSUES]);
    const before = [...input];

    const result = filterAndSortIssues(input, DEFAULT_FILTERS, ME);

    expect(result).not.toBe(input);
    expect([...input]).toEqual(before);
  });
});

describe("formatResultsCount", () => {
  it.each([
    [0, "לא נמצאו דיווחים"],
    [1, "נמצא דיווח אחד"],
    [2, "נמצאו 2 דיווחים"],
    [12, "נמצאו 12 דיווחים"],
  ])("%i -> %s", (count, expected) => {
    expect(formatResultsCount(count)).toBe(expected);
  });
});
