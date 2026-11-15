import type { Issue } from "./types";

/** A valid issue with no votes; tests override only the fields they care about. */
export function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue",
    title: "בור בכביש",
    description: "בור עמוק ליד הכניסה לגן הילדים",
    status: "בהמתנה",
    createdAt: "2026-11-15T06:10:00.000Z",
    authorPhone: "052-1234567",
    ratingSum: 0,
    voteCount: 0,
    ...overrides,
  };
}
