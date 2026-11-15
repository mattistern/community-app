/** Hebrew time labels: relative ("לפני 3 שעות"), countdowns ("4 ימים") and spreadsheet dates. */
import { describe, expect, it } from "vitest";
import {
  formatDateFallback,
  formatDateTime,
  formatRelativeTime,
  formatRemaining,
  formatSortableDateTime,
} from "@/lib/format-time";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
// 09:10 UTC is 11:10 in Israel in November (UTC+2).
const NOW = Date.parse("2026-11-15T09:10:00Z");
const relative = (offsetMs: number) =>
  formatRelativeTime(new Date(NOW - offsetMs).toISOString(), NOW);

describe("formatRelativeTime", () => {
  it.each([
    [30_000, "עכשיו"],
    [-5 * MIN, "עכשיו"], // a slightly fast clock
    [MIN, "לפני דקה"],
    [5 * MIN, "לפני 5 דקות"],
    [HOUR, "לפני שעה"],
    [2 * HOUR, "לפני שעתיים"],
    [23 * HOUR, "לפני 23 שעות"],
    [14 * DAY, "לפני שבועיים"],
    [21 * DAY, "לפני 3 שבועות"],
    [29 * DAY, "לפני 4 שבועות"],
    [45 * DAY, "1.10.2026"],
  ])("%d ms ago -> %s", (offset, expected) => {
    expect(relative(offset)).toBe(expected);
  });

  it("uses calendar days in Israel time for yesterday and a few days ago", () => {
    const at = (iso: string) => formatRelativeTime(iso, NOW);

    expect(at("2026-11-15T06:10:00.000Z")).toBe("לפני 3 שעות");
    expect(at("2026-11-14T08:30:00.000Z")).toBe("אתמול, 10:30");
    expect(at("2026-11-13T21:20:00.000Z")).toBe("לפני יומיים");
    expect(at("2026-11-10T15:45:00.000Z")).toBe("לפני 5 ימים");
    expect(at("2026-11-08T10:00:00.000Z")).toBe("לפני שבוע");
  });
});

describe("formatRemaining (rounds up, so a countdown never shows a spent number)", () => {
  it.each([
    [7 * DAY, "7 ימים"],
    [7 * DAY - MIN, "7 ימים"], // a minute after resolving, still "7"
    [4 * DAY + 3 * HOUR, "5 ימים"],
    [3 * DAY, "3 ימים"],
    [2 * DAY + MIN, "3 ימים"],
    [2 * DAY, "יומיים"],
    [DAY + 23 * HOUR, "יומיים"],
    [DAY, "24 שעות"],
    [23 * HOUR, "23 שעות"],
    [3 * HOUR, "3 שעות"],
    [2 * HOUR + 30 * MIN, "3 שעות"],
    [2 * HOUR, "שעתיים"],
    [HOUR + 20 * MIN, "שעתיים"],
    [HOUR, "פחות משעה"],
    [59 * MIN, "פחות משעה"],
    [0, "פחות משעה"],
    [-5 * MIN, "פחות משעה"],
  ])("%d ms -> %s", (ms, expected) => {
    expect(formatRemaining(ms)).toBe(expected);
  });
});

describe("absolute dates (Israel time: UTC+2 in winter, UTC+3 in summer)", () => {
  it("formatSortableDateTime for spreadsheets", () => {
    expect(formatSortableDateTime("2026-11-14T08:30:00.000Z")).toBe("2026-11-14 10:30");
    expect(formatSortableDateTime("2026-07-01T09:00:00Z")).toBe("2026-07-01 12:00");
    expect(formatSortableDateTime("2026-01-05T22:30:00Z")).toBe("2026-01-06 00:30"); // crosses midnight
  });

  it("formatDateTime for tooltips", () => {
    expect(formatDateTime("2026-07-01T09:00:00Z")).toBe("1.7.2026, 12:00");
    expect(formatDateTime("2026-01-15T09:00:00Z")).toBe("15.1.2026, 11:00");
  });

  it("formatDateFallback needs no Intl, so server and browser always agree", () => {
    expect(formatDateFallback("2026-11-08T10:00:00.000Z")).toBe("8.11.2026");
  });
});
