/**
 * Reporting a new issue (CLAUDE.md §2, DESIGN.md §3D): what must be filled in,
 * the 60-second cooldown between posts, and how a valid form becomes an issue.
 */
import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  POST_COOLDOWN_MS,
  TITLE_MAX_LENGTH,
  buildIssue,
  cooldownRemainingMs,
  formatSeconds,
  nextIssueId,
  validateNewIssue,
  type NewIssueInput,
} from "@/lib/new-issue";
import { makeIssue } from "@/lib/test-helpers";

const valid = { title: "בור בכביש", description: "בור עמוק ליד הגן", location: "" };

describe("validateNewIssue", () => {
  it("needs only a title and a description (location is optional)", () => {
    expect(validateNewIssue(valid)).toEqual({});
    expect(validateNewIssue({ ...valid, location: "רחוב הבנים 12" })).toEqual({});
  });

  it.each(["", "   ", "\n\t "])("requires a title (%j is empty)", (title) => {
    expect(validateNewIssue({ ...valid, title }).title).toBe("יש להזין כותרת");
  });

  it.each(["", "   "])("requires a description (%j is empty)", (description) => {
    expect(validateNewIssue({ ...valid, description }).description).toBe(
      "יש להזין תיאור קצר",
    );
  });

  it("reports both missing fields at once and nothing else", () => {
    expect(Object.keys(validateNewIssue({ ...valid, title: "", description: "" })).sort()).toEqual([
      "description",
      "title",
    ]);
  });

  it("allows text up to the limit and rejects one character more", () => {
    const limits = [
      ["title", TITLE_MAX_LENGTH],
      ["description", DESCRIPTION_MAX_LENGTH],
      ["location", LOCATION_MAX_LENGTH],
    ] as const;

    for (const [field, max] of limits) {
      expect(validateNewIssue({ ...valid, [field]: "א".repeat(max) })[field]).toBeUndefined();
      expect(validateNewIssue({ ...valid, [field]: "א".repeat(max + 1) })[field]).toContain(
        `עד ${max} תווים`,
      );
    }
  });

  it("measures the trimmed text, so padding spaces don't count", () => {
    const padded = `   ${"א".repeat(TITLE_MAX_LENGTH)}   `;
    expect(validateNewIssue({ ...valid, title: padded }).title).toBeUndefined();
  });
});

describe("cooldownRemainingMs (60 seconds between posts)", () => {
  const T = 1_700_000_000_000;

  it("is the spec's 60 seconds", () => {
    expect(POST_COOLDOWN_MS).toBe(60_000);
  });

  it("is 0 for a resident who has never posted", () => {
    expect(cooldownRemainingMs(null, T)).toBe(0);
  });

  it("counts down from a full minute right after a post", () => {
    expect(cooldownRemainingMs(T, T)).toBe(60_000);
    expect(cooldownRemainingMs(T, T + 20_000)).toBe(40_000);
    expect(cooldownRemainingMs(T, T + 59_999)).toBe(1);
  });

  it("is over at exactly 60 seconds and stays over", () => {
    expect(cooldownRemainingMs(T, T + 60_000)).toBe(0);
    expect(cooldownRemainingMs(T, T + 3_600_000)).toBe(0);
  });

  it("never exceeds a minute, even if the clock moved backwards", () => {
    expect(cooldownRemainingMs(T + 5 * 60_000, T)).toBe(60_000);
  });
});

describe("formatSeconds", () => {
  it.each([
    [1, "שנייה אחת"],
    [2, "2 שניות"],
    [59, "59 שניות"],
  ])("%i -> %s", (seconds, expected) => {
    expect(formatSeconds(seconds)).toBe(expected);
  });
});

describe("nextIssueId", () => {
  it("is one more than the highest numeric id", () => {
    const issues = [makeIssue({ id: "101" }), makeIssue({ id: "113" }), makeIssue({ id: "105" })];
    expect(nextIssueId(issues)).toBe("114");
  });

  it("ignores ids that are not whole numbers", () => {
    const issues = [makeIssue({ id: "abc" }), makeIssue({ id: "7" }), makeIssue({ id: "3.5" })];
    expect(nextIssueId(issues)).toBe("8");
  });

  it("starts at 1 when there are no issues", () => {
    expect(nextIssueId([])).toBe("1");
  });
});

describe("buildIssue", () => {
  const NOW = Date.parse("2026-11-15T09:10:00.000Z");
  const context = { id: "114", now: NOW, authorPhone: "052-1234567" };
  const full: NewIssueInput = {
    title: "  בור בכביש  ",
    description: "  בור עמוק ליד הגן  ",
    category: "תשתיות וכבישים",
    location: "  רחוב הבנים 12  ",
    media: { type: "image", thumbnailUrl: "data:thumb", fullUrl: "data:full", alt: "" },
  };

  it("makes a pending issue with no votes, authored by the resident", () => {
    const issue = buildIssue(full, context);

    expect(issue).toMatchObject({
      id: "114",
      status: "בהמתנה",
      authorPhone: "052-1234567",
      ratingSum: 0,
      voteCount: 0,
      createdAt: "2026-11-15T09:10:00.000Z",
    });
    expect(issue.myVote).toBeUndefined();
    expect(issue.adminNote).toBeUndefined();
  });

  it("trims the text and keeps the optional fields", () => {
    const issue = buildIssue(full, context);

    expect(issue.title).toBe("בור בכביש");
    expect(issue.description).toBe("בור עמוק ליד הגן");
    expect(issue.location).toBe("רחוב הבנים 12");
    expect(issue.category).toBe("תשתיות וכבישים");
  });

  it("uses the title as the photo's alt text and keeps both versions", () => {
    expect(buildIssue(full, context).media).toEqual({
      type: "image",
      thumbnailUrl: "data:thumb",
      fullUrl: "data:full",
      alt: "בור בכביש",
    });
  });

  it("leaves out whatever was not filled in", () => {
    const issue = buildIssue(
      { title: "פנס כבוי", description: "חשוך בלילה", category: null, location: "   ", media: null },
      context,
    );

    expect(issue.category).toBeUndefined();
    expect(issue.location).toBeUndefined();
    expect(issue.media).toBeUndefined();
  });
});
