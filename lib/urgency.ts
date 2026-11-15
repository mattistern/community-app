import type { Issue } from "./types";

/** Minimum confidence votes (m) and neutral baseline (C) per CLAUDE.md. */
export const BAYES_MIN_VOTES = 5;
export const BAYES_BASELINE = 3.0;

/** The 1-5 urgency scale offered to residents, with its Hebrew labels. */
export const URGENCY_LEVELS = [
  { value: 1, label: "לא דחוף" },
  { value: 2, label: "פחות דחוף" },
  { value: 3, label: "בינוני" },
  { value: 4, label: "דחוף" },
  { value: 5, label: "דחוף מאוד" },
] as const;

/** True only for the offered levels, i.e. whole numbers from 1 to 5. */
export function isValidRating(value: number): boolean {
  return URGENCY_LEVELS.some((level) => level.value === value);
}

export function averageRating(ratingSum: number, voteCount: number): number {
  return voteCount === 0 ? 0 : ratingSum / voteCount;
}

/** Hebrew vote count with correct singular/zero forms. */
export function formatVoteCount(voteCount: number): string {
  if (voteCount === 0) return "אין הצבעות עדיין";
  if (voteCount === 1) return "הצבעה אחת";
  return `${voteCount} הצבעות`;
}

/** WeightedScore = ((v * R) + (m * C)) / (v + m) */
export function bayesianScore(
  ratingSum: number,
  voteCount: number,
  m = BAYES_MIN_VOTES,
  c = BAYES_BASELINE,
): number {
  const r = averageRating(ratingSum, voteCount);
  return (voteCount * r + m * c) / (voteCount + m);
}

/** An issue's Bayesian urgency score from its current votes. */
export function urgencyScore(issue: Issue): number {
  return bayesianScore(issue.ratingSum, issue.voteCount);
}

/**
 * Most urgent first. Pass `score` to rank from fixed scores instead of the
 * live votes (the feed holds its order while a resident is voting).
 */
export function sortByUrgency(
  issues: Issue[],
  score: (issue: Issue) => number = urgencyScore,
): Issue[] {
  return [...issues].sort((a, b) => score(b) - score(a));
}

/**
 * Applies a vote change (new or updated) and returns the new aggregate.
 * A resident has at most one vote per issue: voting again replaces the
 * previous value instead of adding a second vote.
 * @throws RangeError unless `value` is a whole number from 1 to 5.
 */
export function applyVote(issue: Issue, value: number): Issue {
  if (!isValidRating(value)) {
    throw new RangeError(
      `Urgency vote must be a whole number from 1 to 5, got ${value}`,
    );
  }
  const prev = issue.myVote;
  return {
    ...issue,
    myVote: value,
    ratingSum: issue.ratingSum - (prev ?? 0) + value,
    voteCount: issue.voteCount + (prev === undefined ? 1 : 0),
  };
}
