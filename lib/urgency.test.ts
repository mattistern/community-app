/**
 * CLAUDE.md mandatory test #2: voting and Bayesian ranking.
 *   - the 1-5 rating scale (and rejection of anything else)
 *   - one vote per resident per issue; updating a vote never adds a duplicate
 *   - WeightedScore = ((v * R) + (m * C)) / (v + m), with m = 5 and C = 3.0,
 *     and sorting by it for "דחוף ביותר"
 *
 * Expected numbers are worked out by hand from the formula, not computed with
 * the helpers under test.
 */
import { describe, expect, it } from "vitest";
import { makeIssue } from "@/lib/test-helpers";
import type { Issue } from "@/lib/types";
import {
  BAYES_BASELINE,
  BAYES_MIN_VOTES,
  URGENCY_LEVELS,
  applyVote,
  averageRating,
  bayesianScore,
  formatVoteCount,
  isValidRating,
  sortByUrgency,
  urgencyScore,
} from "@/lib/urgency";

/** An issue whose votes so far add up to `ratingSum` over `voteCount` votes. */
const withVotes = (id: string, ratingSum: number, voteCount: number) =>
  makeIssue({ id, ratingSum, voteCount });

const ids = (issues: Issue[]) => issues.map((issue) => issue.id);

describe("urgency scale (1-5)", () => {
  it("offers exactly the levels 1 to 5, each with its own Hebrew label", () => {
    expect(URGENCY_LEVELS.map((level) => level.value)).toEqual([1, 2, 3, 4, 5]);

    const labels = URGENCY_LEVELS.map((level) => level.label);
    expect(new Set(labels).size).toBe(5);
    for (const label of labels) expect(label).toMatch(/[\u{590}-\u{5FF}]/u);
  });

  it.each([1, 2, 3, 4, 5])("accepts %i", (value) => {
    expect(isValidRating(value)).toBe(true);
  });

  it.each([0, 6, -1, 3.5, 4.999, NaN, Infinity, -Infinity])(
    "rejects %s",
    (value) => {
      expect(isValidRating(value)).toBe(false);
    },
  );

  it("rejects non-numbers that slip past the type system (e.g. JSON input)", () => {
    for (const value of ["3", null, undefined, true, [3]]) {
      expect(isValidRating(value as unknown as number)).toBe(false);
    }
  });
});

describe("averageRating", () => {
  it("is 0 with no votes (never NaN)", () => {
    expect(averageRating(0, 0)).toBe(0);
  });

  it("is the rating sum divided by the vote count", () => {
    expect(averageRating(9, 2)).toBe(4.5);
    expect(averageRating(113, 24)).toBeCloseTo(4.7083, 4);
  });
});

describe("formatVoteCount", () => {
  it.each([
    [0, "אין הצבעות עדיין"],
    [1, "הצבעה אחת"],
    [2, "2 הצבעות"],
    [24, "24 הצבעות"],
  ])("%i -> %s", (count, expected) => {
    expect(formatVoteCount(count)).toBe(expected);
  });
});

describe("bayesianScore", () => {
  it("uses the spec constants: m = 5 minimum votes, C = 3.0 baseline", () => {
    expect(BAYES_MIN_VOTES).toBe(5);
    expect(BAYES_BASELINE).toBe(3.0);
  });

  it("matches WeightedScore = ((v * R) + (m * C)) / (v + m)", () => {
    // v = 24, R = 113 / 24, so v * R = 113:  (113 + 5 * 3) / (24 + 5)
    expect(bayesianScore(113, 24)).toBeCloseTo((113 + 5 * 3) / (24 + 5), 10);
    // v = 2, R = 4.5, so v * R = 9:  (9 + 5 * 3) / (2 + 5)
    expect(bayesianScore(9, 2)).toBeCloseTo((9 + 5 * 3) / (2 + 5), 10);
    // v = 3, R = 14 / 3:  (14 + 15) / 8
    expect(bayesianScore(14, 3)).toBeCloseTo((14 + 5 * 3) / (3 + 5), 10);
  });

  it("scores an issue with no votes at exactly the neutral baseline", () => {
    expect(bayesianScore(0, 0)).toBe(3.0);
  });

  it("honors custom m and C", () => {
    // v = 2, v * R = 10, m = 10, C = 2.5:  (10 + 25) / 12
    expect(bayesianScore(10, 2, 10, 2.5)).toBeCloseTo((10 + 10 * 2.5) / (2 + 10), 10);
  });

  it("does not let a single top vote outrank a well-supported issue", () => {
    const onePerfectVote = bayesianScore(5, 1); // (5 + 15) / 6 = 3.33
    const wellSupported = bayesianScore(113, 24); // 128 / 29 = 4.41
    expect(onePerfectVote).toBeLessThan(wellSupported);
  });

  it("moves toward the real average as votes accumulate (high ratings)", () => {
    // Everyone votes 5: more votes => higher score, always below 5, above C.
    const scores = [1, 5, 20, 100].map((votes) => bayesianScore(5 * votes, votes));

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]);
    }
    expect(Math.min(...scores)).toBeGreaterThan(BAYES_BASELINE);
    expect(Math.max(...scores)).toBeLessThan(5);
  });

  it("moves toward the real average as votes accumulate (low ratings)", () => {
    // Everyone votes 1: more votes => lower score, always above 1, below C.
    const scores = [1, 5, 20, 100].map((votes) => bayesianScore(1 * votes, votes));

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThan(scores[i - 1]);
    }
    expect(Math.max(...scores)).toBeLessThan(BAYES_BASELINE);
    expect(Math.min(...scores)).toBeGreaterThan(1);
  });

  it("keeps an average equal to the baseline at the baseline, whatever the count", () => {
    for (const votes of [1, 7, 50]) {
      expect(bayesianScore(3 * votes, votes)).toBeCloseTo(3, 10);
    }
  });
});

describe("sortByUrgency", () => {
  it("ranks by Bayesian score, not by raw average", () => {
    const lonelyFive = withVotes("lonely-five", 5, 1); // raw 5.00, but one vote
    const established = withVotes("established", 113, 24); // raw 4.71, 24 votes
    const small = withVotes("small", 9, 2); // raw 4.50, two votes
    const input = [lonelyFive, established, small];

    // Premise of this test: raw averages would give a different order.
    const byRawAverage = [...input].sort(
      (a, b) =>
        averageRating(b.ratingSum, b.voteCount) -
        averageRating(a.ratingSum, a.voteCount),
    );
    expect(ids(byRawAverage)).toEqual(["lonely-five", "established", "small"]);

    // Bayesian: established 4.41 > small 3.43 > lonely-five 3.33.
    expect(ids(sortByUrgency(input))).toEqual([
      "established",
      "small",
      "lonely-five",
    ]);
  });

  it("orders a realistic mix, most urgent first", () => {
    const input = [
      withVotes("101", 113, 24), // 4.41
      withVotes("102", 9, 2), //   3.43
      withVotes("103", 34, 11), // 3.06
      withVotes("104", 14, 3), //  3.63
      withVotes("105", 16, 6), //  2.82
    ];

    expect(ids(sortByUrgency(input))).toEqual(["101", "104", "102", "103", "105"]);
  });

  it("places unvoted issues at the neutral baseline", () => {
    const input = [
      withVotes("low-urgency", 16, 6), // 2.82, below the baseline
      withVotes("unvoted", 0, 0), //      3.00, exactly the baseline
      withVotes("mildly-urgent", 34, 11), // 3.06, above the baseline
    ];

    expect(ids(sortByUrgency(input))).toEqual([
      "mildly-urgent",
      "unvoted",
      "low-urgency",
    ]);
  });

  it("scores an issue from its current votes", () => {
    expect(urgencyScore(withVotes("a", 113, 24))).toBeCloseTo((113 + 5 * 3) / (24 + 5), 10);
    expect(urgencyScore(withVotes("none", 0, 0))).toBe(3.0);
  });

  it("can rank from supplied scores instead of the live votes", () => {
    const a = withVotes("a", 113, 24); // live 4.41
    const b = withVotes("b", 9, 2); //    live 3.43
    const fixed = new Map([
      ["a", 1],
      ["b", 2],
    ]);

    const ranked = sortByUrgency([a, b], (issue) => fixed.get(issue.id) ?? 0);

    expect(ids(ranked)).toEqual(["b", "a"]);
  });

  it("returns a new array and leaves its input untouched", () => {
    const input = [withVotes("a", 5, 1), withVotes("b", 113, 24)];
    const snapshot = [...input];

    const sorted = sortByUrgency(input);

    expect(sorted).not.toBe(input);
    expect(input).toEqual(snapshot);
  });

  it("handles an empty feed", () => {
    expect(sortByUrgency([])).toEqual([]);
  });
});

describe("applyVote", () => {
  it("counts a first vote once and adds it to the rating sum", () => {
    const voted = applyVote(withVotes("a", 113, 24), 1);

    expect(voted).toMatchObject({ myVote: 1, ratingSum: 114, voteCount: 25 });
    expect(averageRating(voted.ratingSum, voted.voteCount)).toBeCloseTo(4.56, 10);
  });

  it("updates an existing vote without adding a duplicate", () => {
    // 113 from others + my earlier 5 = 118 over 24 + 1 = 25 votes.
    const issue = makeIssue({ ratingSum: 118, voteCount: 25, myVote: 5 });

    const changed = applyVote(issue, 2);

    // My 5 is swapped for a 2: sum drops by 3, count stays 25.
    expect(changed).toMatchObject({ myVote: 2, ratingSum: 115, voteCount: 25 });
  });

  it("is idempotent when the same value is voted again", () => {
    const once = applyVote(withVotes("a", 113, 24), 4);
    const twice = applyVote(once, 4);

    expect(twice).toEqual(once);
  });

  it("counts a changing voter exactly once across several updates", () => {
    const issue = withVotes("a", 113, 24);

    const final = [1, 5, 3].reduce((acc, value) => applyVote(acc, value), issue);

    expect(final).toMatchObject({ myVote: 3, ratingSum: 116, voteCount: 25 });
  });

  it("never lets one resident contribute more than one vote", () => {
    // 100 votes from the same resident on an empty issue.
    const votes = Array.from({ length: 100 }, (_, i) => ((i * 7) % 5) + 1);

    const final = votes.reduce((acc, value) => applyVote(acc, value), makeIssue());

    expect(final.voteCount).toBe(1);
    expect(final.ratingSum).toBe(final.myVote);
  });

  it.each([1, 2, 3, 4, 5])("accepts the rating %i", (value) => {
    expect(applyVote(makeIssue(), value).myVote).toBe(value);
  });

  it.each([0, 6, -1, 3.5, NaN, Infinity])(
    "rejects %s and leaves the issue untouched",
    (value) => {
      const issue = Object.freeze(withVotes("a", 113, 24));

      expect(() => applyVote(issue, value)).toThrow(RangeError);
      expect(issue).toEqual(withVotes("a", 113, 24));
    },
  );

  it("does not mutate the issue it is given", () => {
    const issue = Object.freeze(withVotes("a", 113, 24));

    const voted = applyVote(issue, 3);

    expect(voted).not.toBe(issue);
    expect(issue).toEqual(withVotes("a", 113, 24));
  });

  it("keeps every other field of the issue", () => {
    const issue = makeIssue({
      id: "101",
      category: "תשתיות וכבישים",
      location: "רחוב הבנים 12",
      adminNote: "הועבר לקבלן המועצה",
      ratingSum: 113,
      voteCount: 24,
    });

    expect(applyVote(issue, 4)).toMatchObject({
      id: "101",
      title: issue.title,
      status: issue.status,
      category: "תשתיות וכבישים",
      location: "רחוב הבנים 12",
      adminNote: "הועבר לקבלן המועצה",
      authorPhone: issue.authorPhone,
      createdAt: issue.createdAt,
    });
  });
});
