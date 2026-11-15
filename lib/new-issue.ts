/**
 * Business rules for reporting a new issue (CLAUDE.md §2, DESIGN.md §3D):
 * validation, the post cooldown, ids and building the issue. Pure functions so
 * the same rules can later run on the server as well as in the browser.
 */
import type { Issue, IssueCategory, IssueMedia } from "./types";

export const TITLE_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 500;
export const LOCATION_MAX_LENGTH = 80;

/** CLAUDE.md §2 (spam prevention): minimum time between a resident's new posts. */
export const POST_COOLDOWN_MS = 60_000;

export interface NewIssueInput {
  title: string;
  description: string;
  /** Optional. */
  category: IssueCategory | null;
  /** Optional free text, e.g. "רחוב הבנים 12". */
  location: string;
  /** Optional photo, already compressed. */
  media: IssueMedia | null;
}

export type NewIssueErrors = Partial<
  Record<"title" | "description" | "location", string>
>;

/** Title and description are required; category, location and photo are not. */
export function validateNewIssue(
  input: Pick<NewIssueInput, "title" | "description" | "location">,
): NewIssueErrors {
  const errors: NewIssueErrors = {};
  const title = input.title.trim();
  const description = input.description.trim();

  if (title === "") {
    errors.title = "יש להזין כותרת";
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `הכותרת ארוכה מדי (עד ${TITLE_MAX_LENGTH} תווים)`;
  }

  if (description === "") {
    errors.description = "יש להזין תיאור קצר";
  } else if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `התיאור ארוך מדי (עד ${DESCRIPTION_MAX_LENGTH} תווים)`;
  }

  if (input.location.trim().length > LOCATION_MAX_LENGTH) {
    errors.location = `המיקום ארוך מדי (עד ${LOCATION_MAX_LENGTH} תווים)`;
  }

  return errors;
}

/** Milliseconds until the resident may post again; 0 when they already may. */
export function cooldownRemainingMs(
  lastPostAt: number | null,
  now: number,
): number {
  if (lastPostAt === null) return 0;
  const remaining = POST_COOLDOWN_MS - (now - lastPostAt);
  // Capped so a clock that moved backwards can't lock a resident out for longer.
  return Math.min(POST_COOLDOWN_MS, Math.max(0, remaining));
}

/** Thrown when a post is attempted before the cooldown has passed. */
export class CooldownError extends Error {
  constructor(readonly remainingMs: number) {
    super("Post cooldown is still active");
    this.name = "CooldownError";
  }
}

/** Hebrew seconds with the singular form: "שנייה אחת", "5 שניות". */
export function formatSeconds(seconds: number): string {
  return seconds === 1 ? "שנייה אחת" : `${seconds} שניות`;
}

/** Next sequential id, ignoring any non-numeric ids. */
export function nextIssueId(issues: readonly Pick<Issue, "id">[]): string {
  const highest = issues.reduce((max, { id }) => {
    const n = Number(id);
    return Number.isInteger(n) && n > max ? n : max;
  }, 0);
  return String(highest + 1);
}

/**
 * Turns a valid form into an issue: trimmed text, status "בהמתנה", no votes yet.
 * The photo's alt text is the title.
 */
export function buildIssue(
  input: NewIssueInput,
  context: { id: string; now: number; authorPhone: string },
): Issue {
  const title = input.title.trim();
  return {
    id: context.id,
    title,
    description: input.description.trim(),
    status: "בהמתנה",
    category: input.category ?? undefined,
    location: input.location.trim() || undefined,
    media: input.media ? { ...input.media, alt: title } : undefined,
    createdAt: new Date(context.now).toISOString(),
    authorPhone: context.authorPhone,
    ratingSum: 0,
    voteCount: 0,
  };
}
