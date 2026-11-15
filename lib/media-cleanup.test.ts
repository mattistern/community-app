/**
 * CLAUDE.md mandatory test #4, the media lifecycle: when an admin resolves an
 * issue (בוצע or נדחה) its media is deleted after a 7-day grace period, and
 * moving the status back during that time cancels the deletion.
 */
import { describe, expect, it } from "vitest";
import {
  MEDIA_GRACE_PERIOD_MS,
  isResolvedStatus,
  msUntilMediaDeletion,
  shiftResolvedTimes,
  sweepExpiredMedia,
  withStatus,
} from "@/lib/media-cleanup";
import { makeIssue } from "@/lib/test-helpers";
import type { Issue } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-11-15T09:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const photo = { type: "image" as const, thumbnailUrl: "data:t", fullUrl: "data:f", alt: "תמונה" };

/** A resolved issue with a photo, resolved `resolvedAgo` ago. */
const resolved = (resolvedAgo: number, overrides: Partial<Issue> = {}) =>
  makeIssue({ status: "בוצע", resolvedAt: ago(resolvedAgo), media: photo, ...overrides });

describe("the grace period", () => {
  it("is 7 days, as in the spec", () => {
    expect(MEDIA_GRACE_PERIOD_MS).toBe(7 * DAY);
  });

  it("applies to בוצע and נדחה only", () => {
    expect(isResolvedStatus("בוצע")).toBe(true);
    expect(isResolvedStatus("נדחה")).toBe(true);
    expect(isResolvedStatus("בהמתנה")).toBe(false);
    expect(isResolvedStatus("בתהליך")).toBe(false);
  });
});

describe("withStatus (an admin changes the status)", () => {
  it.each(["בוצע", "נדחה"] as const)("%s records when it was resolved", (status) => {
    const issue = withStatus(makeIssue({ status: "בתהליך" }), status, NOW);

    expect(issue.status).toBe(status);
    expect(issue.resolvedAt).toBe("2026-11-15T09:00:00.000Z");
  });

  it("moving it back to an open status cancels the deletion", () => {
    const done = withStatus(makeIssue({ media: photo }), "בוצע", NOW);

    const reopened = withStatus(done, "בתהליך", NOW + DAY);

    expect(reopened.status).toBe("בתהליך");
    expect(reopened.resolvedAt).toBeUndefined();
    expect(msUntilMediaDeletion(reopened, NOW + 30 * DAY)).toBeNull();
  });

  it("setting the same status changes nothing, so the clock isn't restarted", () => {
    const issue = resolved(5 * DAY);

    expect(withStatus(issue, "בוצע", NOW)).toBe(issue);
  });

  it("switching between בוצע and נדחה starts the clock again (a correction can only delay deletion)", () => {
    const done = resolved(5 * DAY);

    const rejected = withStatus(done, "נדחה", NOW);

    expect(rejected.resolvedAt).toBe("2026-11-15T09:00:00.000Z");
    expect(msUntilMediaDeletion(rejected, NOW)).toBe(7 * DAY);
  });

  it("keeps everything else, including the note that the media is already gone", () => {
    const issue = makeIssue({
      status: "בוצע",
      resolvedAt: ago(10 * DAY),
      mediaRemovedAt: ago(3 * DAY),
      adminNote: "טופל",
      ratingSum: 9,
      voteCount: 2,
    });

    const reopened = withStatus(issue, "בתהליך", NOW);

    expect(reopened).toMatchObject({
      adminNote: "טופל",
      ratingSum: 9,
      voteCount: 2,
      mediaRemovedAt: ago(3 * DAY),
    });
  });
});

describe("msUntilMediaDeletion", () => {
  it("counts down from 7 days after resolving", () => {
    expect(msUntilMediaDeletion(resolved(0), NOW)).toBe(7 * DAY);
    expect(msUntilMediaDeletion(resolved(3 * DAY), NOW)).toBe(4 * DAY);
  });

  it("reaches zero exactly at 7 days and goes negative after", () => {
    expect(msUntilMediaDeletion(resolved(7 * DAY), NOW)).toBe(0);
    expect(msUntilMediaDeletion(resolved(8 * DAY), NOW)).toBe(-DAY);
  });

  it("is null when nothing is scheduled", () => {
    expect(msUntilMediaDeletion(makeIssue({ media: photo }), NOW)).toBeNull(); // not resolved
    expect(msUntilMediaDeletion(makeIssue({ status: "בוצע", resolvedAt: ago(DAY) }), NOW)).toBeNull(); // no media
    expect(msUntilMediaDeletion(makeIssue({ status: "בוצע", media: photo }), NOW)).toBeNull(); // no timestamp
    expect(msUntilMediaDeletion(resolved(DAY, { status: "בהמתנה" }), NOW)).toBeNull(); // status moved back
  });

  it("never schedules a deletion from a garbage timestamp", () => {
    const broken = makeIssue({ status: "בוצע", resolvedAt: "not a date", media: photo });

    expect(msUntilMediaDeletion(broken, NOW)).toBeNull();
    expect(sweepExpiredMedia([broken], NOW).issues[0].media).toBeDefined();
  });
});

describe("sweepExpiredMedia (the cleanup)", () => {
  it.each(["בוצע", "נדחה"] as const)("deletes the media of a %s issue past the window and keeps the record", (status) => {
    const issue = resolved(8 * DAY, { status, title: "גיזום עצים", adminNote: "טופל", ratingSum: 34, voteCount: 11 });

    const { issues, removedFrom } = sweepExpiredMedia([issue], NOW);

    expect(removedFrom).toEqual([issue.id]);
    expect(issues[0].media).toBeUndefined();
    expect(issues[0].mediaRemovedAt).toBe("2026-11-15T09:00:00.000Z");
    expect(issues[0]).toMatchObject({ title: "גיזום עצים", status, adminNote: "טופל", ratingSum: 34, voteCount: 11 });
  });

  it("deletes at exactly 7 days, not a millisecond earlier", () => {
    expect(sweepExpiredMedia([resolved(7 * DAY)], NOW).removedFrom).toHaveLength(1);
    expect(sweepExpiredMedia([resolved(7 * DAY - 1)], NOW).removedFrom).toHaveLength(0);
  });

  it("leaves an issue that is still inside its grace period", () => {
    const issue = resolved(3 * DAY);

    const result = sweepExpiredMedia([issue], NOW);

    expect(result.issues[0]).toBe(issue);
    expect(result.issues[0].media).toBeDefined();
  });

  it("never touches an open issue, however old", () => {
    const old = makeIssue({ status: "בהמתנה", createdAt: ago(90 * DAY), media: photo });

    expect(sweepExpiredMedia([old], NOW).issues[0].media).toBeDefined();
  });

  it("has nothing to delete (and records nothing) for a resolved issue without media", () => {
    const issue = makeIssue({ status: "בוצע", resolvedAt: ago(30 * DAY) });

    const { issues, removedFrom } = sweepExpiredMedia([issue], NOW);

    expect(removedFrom).toEqual([]);
    expect(issues[0].mediaRemovedAt).toBeUndefined();
  });

  it("reverting the status during the grace period cancels the deletion", () => {
    const done = withStatus(makeIssue({ media: photo }), "בוצע", NOW);
    const reopened = withStatus(done, "בהמתנה", NOW + 2 * DAY);

    const { issues, removedFrom } = sweepExpiredMedia([reopened], NOW + 60 * DAY);

    expect(removedFrom).toEqual([]);
    expect(issues[0].media).toBeDefined();
  });

  it("deletes only the issues that are due", () => {
    const due = resolved(9 * DAY, { id: "1" });
    const soon = resolved(6 * DAY, { id: "2" });
    const open = makeIssue({ id: "3", media: photo });

    const { issues, removedFrom } = sweepExpiredMedia([due, soon, open], NOW);

    expect(removedFrom).toEqual(["1"]);
    expect(issues[0].media).toBeUndefined();
    expect(issues[1]).toBe(soon);
    expect(issues[2]).toBe(open);
  });

  it("returns the very same array when nothing is due", () => {
    const list = [resolved(DAY), makeIssue({ media: photo })];

    expect(sweepExpiredMedia(list, NOW).issues).toBe(list);
  });

  it("running it again does nothing more", () => {
    const first = sweepExpiredMedia([resolved(9 * DAY)], NOW);

    const second = sweepExpiredMedia(first.issues, NOW + DAY);

    expect(second.removedFrom).toEqual([]);
    expect(second.issues).toBe(first.issues);
  });
});

describe("shiftResolvedTimes (the demo's fast-forward)", () => {
  it("moves every resolved timestamp back, so deletions come sooner", () => {
    const issue = resolved(3 * DAY);

    const [shifted] = shiftResolvedTimes([issue], 7 * DAY);

    expect(shifted.resolvedAt).toBe(ago(10 * DAY));
    expect(msUntilMediaDeletion(shifted, NOW)).toBe(-3 * DAY);
  });

  it("leaves issues that were never resolved untouched", () => {
    const open = makeIssue();

    expect(shiftResolvedTimes([open], 7 * DAY)[0]).toBe(open);
  });
});
