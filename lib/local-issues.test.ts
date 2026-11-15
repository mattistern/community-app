/**
 * The local-first data layer: what survives a reload, the 60-second cooldown it
 * enforces in place of a server, and that a failed save leaves no half-saved
 * state. Runs against a fake localStorage; "reloading" re-imports the module so
 * its in-memory state starts fresh while the storage stays.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NewIssueInput } from "@/lib/new-issue";
import { POST_COOLDOWN_MS } from "@/lib/new-issue";
import { makeIssue } from "@/lib/test-helpers";

const ISSUES_KEY = "community-app:issues";
const ME = "052-1234567";

/**
 * localStorage with a size quota, like a real browser: a write fails only when
 * it would not fit, so a big photo can be refused while a tiny key still fits.
 */
class FakeStorage {
  private data = new Map<string, string>();
  capacity = Infinity;

  private size() {
    let total = 0;
    for (const [key, value] of this.data) total += key.length + value.length;
    return total;
  }
  /** From now on only `headroom` more characters fit. */
  fillUp(headroom = 0) {
    this.capacity = this.size() + headroom;
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    const replaced = this.data.get(key);
    const after =
      this.size() - (replaced === undefined ? 0 : key.length + replaced.length) + key.length + value.length;
    if (after > this.capacity) throw new DOMException("quota", "QuotaExceededError");
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  get length() {
    return this.data.size;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
}

let storage: FakeStorage;

/**
 * A fresh page load: new module state, same storage. Also hands back the
 * CooldownError from the same module graph, because resetting modules gives the
 * store its own copy of the class and `instanceof` only works within one copy.
 */
async function loadPage() {
  vi.resetModules();
  vi.stubGlobal("window", {
    localStorage: storage,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  const store = await import("@/lib/local-issues");
  const rules = await import("@/lib/new-issue");
  return { ...store, CooldownError: rules.CooldownError };
}

const report = (overrides: Partial<NewIssueInput> = {}): NewIssueInput => ({
  title: "פנס כבוי ברחוב",
  description: "חשוך בלילה",
  category: "תאורה חשמל",
  location: "רחוב הזית 4",
  media: null,
  ...overrides,
});

const NOW = Date.parse("2026-11-15T09:00:00.000Z");

beforeEach(() => {
  storage = new FakeStorage();
});

describe("first run and reloads", () => {
  it("starts with the 13 demo issues and saves them", async () => {
    const store = await loadPage();

    expect(store.getIssues()).toHaveLength(13);
    const saved = JSON.parse(storage.getItem(ISSUES_KEY)!);
    expect(saved.version).toBe(2);
    expect(saved.data).toHaveLength(13);
  });

  it("keeps what was saved on the next load instead of re-seeding", async () => {
    const first = await loadPage();
    first.voteOnIssue("101", 1);

    const second = await loadPage();

    const issue = second.getIssues().find((i) => i.id === "101")!;
    expect(issue).toMatchObject({ myVote: 1, voteCount: 25, ratingSum: 114 });
  });

  it("replaces data saved by an older version with fresh demo data", async () => {
    storage.setItem(ISSUES_KEY, JSON.stringify({ version: 0, issues: [] }));

    const store = await loadPage();

    expect(store.getIssues()).toHaveLength(13);
  });

  it("falls back to demo data when the saved text is corrupt", async () => {
    storage.setItem(ISSUES_KEY, "{not json");

    const store = await loadPage();

    expect(store.getIssues()).toHaveLength(13);
  });
});

describe("voteOnIssue", () => {
  it("updates the vote and the aggregate without adding a duplicate", async () => {
    const store = await loadPage();

    store.voteOnIssue("101", 1);
    store.voteOnIssue("101", 5);

    expect(store.getIssues().find((i) => i.id === "101")).toMatchObject({
      myVote: 5,
      voteCount: 25,
      ratingSum: 118,
    });
  });

  it("still applies in memory when the browser can't save it", async () => {
    const store = await loadPage();
    store.getIssues();
    storage.fillUp();

    store.voteOnIssue("101", 1);

    expect(store.getIssues().find((i) => i.id === "101")?.myVote).toBe(1);
  });
});

describe("createIssue", () => {
  it("adds the report at the top with the next id and saves it", async () => {
    const store = await loadPage();

    const issue = store.createIssue(report(), ME, NOW);

    expect(issue).toMatchObject({
      id: "114",
      status: "בהמתנה",
      authorPhone: ME,
      createdAt: "2026-11-15T09:00:00.000Z",
    });
    expect(store.getIssues()[0]).toBe(issue);
    expect(store.getIssues()).toHaveLength(14);

    const reloaded = await loadPage();
    expect(reloaded.getIssues()[0]).toMatchObject({ id: "114", title: "פנס כבוי ברחוב" });
  });

  it("remembers when the resident last posted", async () => {
    const store = await loadPage();

    expect(store.getLastPostAt(ME)).toBeNull();
    store.createIssue(report(), ME, NOW);

    expect(store.getLastPostAt(ME)).toBe(NOW);
  });

  it("refuses a second post within a minute (the cooldown the server will enforce)", async () => {
    const store = await loadPage();
    store.createIssue(report(), ME, NOW);

    const attempt = () => store.createIssue(report({ title: "עוד אחד" }), ME, NOW + 20_000);

    expect(attempt).toThrow(store.CooldownError);
    try {
      attempt();
    } catch (error) {
      expect((error as InstanceType<typeof store.CooldownError>).remainingMs).toBe(40_000);
    }
    expect(store.getIssues()).toHaveLength(14);
  });

  it("allows the next post once the minute has passed", async () => {
    const store = await loadPage();
    store.createIssue(report(), ME, NOW);

    const second = store.createIssue(report({ title: "אחרי דקה" }), ME, NOW + POST_COOLDOWN_MS);

    expect(second.id).toBe("115");
    expect(store.getIssues()).toHaveLength(15);
  });

  it("keeps the cooldown across a reload, per resident", async () => {
    const first = await loadPage();
    first.createIssue(report(), ME, NOW);

    const second = await loadPage();

    expect(() => second.createIssue(report(), ME, NOW + 1_000)).toThrow(second.CooldownError);
    expect(() => second.createIssue(report(), "050-0000000", NOW + 1_000)).not.toThrow();
  });

  it("when storage is full: throws, adds nothing, and doesn't use up the cooldown", async () => {
    const store = await loadPage();
    store.getIssues(); // the app has loaded (and saved its demo data) before the storage fills up
    storage.fillUp(100); // room for a tiny key like the cooldown timestamp, not for a report

    expect(() => store.createIssue(report(), ME, NOW)).toThrowError(store.StorageFullError);

    expect(store.getIssues()).toHaveLength(13);
    expect(JSON.parse(storage.getItem(ISSUES_KEY)!).data).toHaveLength(13);
    expect(store.getLastPostAt(ME)).toBeNull();

    storage.capacity = Infinity; // the resident frees up some space
    expect(() => store.createIssue(report(), ME, NOW + 1_000)).not.toThrow();
  });
});

describe("data saved by version 1 (before the media lifecycle)", () => {
  const legacy = (issues: unknown[]) =>
    storage.setItem(ISSUES_KEY, JSON.stringify({ version: 1, issues }));

  it("keeps a tester's reports and stamps already-resolved issues", async () => {
    const created = "2026-11-10T08:00:00.000Z";
    legacy([
      makeIssue({ id: "130", title: "דיווח שנוצר בבדיקה", status: "בהמתנה" }),
      makeIssue({ id: "103", title: "כבר טופל", status: "בוצע", createdAt: created }),
    ]);

    const store = await loadPage();

    const issues = store.getIssues();
    expect(issues.map((i) => i.id)).toEqual(["130", "103"]);
    expect(issues[0].resolvedAt).toBeUndefined();
    expect(issues[1].resolvedAt).toBe(created);
  });

  it("saves the upgraded data, so the upgrade happens once", async () => {
    legacy([makeIssue({ id: "130" })]);

    const store = await loadPage();
    store.getIssues(); // the app reads the issues on its first render

    const saved = JSON.parse(storage.getItem(ISSUES_KEY)!);
    expect(saved.version).toBe(2);
    expect(saved.data).toHaveLength(1);
  });
});

describe("admin: changing status and the 7-day media grace period", () => {
  const find = (store: Awaited<ReturnType<typeof loadPage>>, id: string) =>
    store.getIssues().find((issue) => issue.id === id)!;

  it("resolving an issue stamps when, and moving it back cancels the deletion", async () => {
    const store = await loadPage();

    store.setIssueStatus("101", "בוצע", NOW);
    expect(find(store, "101")).toMatchObject({ status: "בוצע", resolvedAt: "2026-11-15T09:00:00.000Z" });

    store.setIssueStatus("101", "בתהליך", NOW + 1_000);
    expect(find(store, "101").status).toBe("בתהליך");
    expect(find(store, "101").resolvedAt).toBeUndefined();
  });

  it("keeps the status change and its timestamp across a reload", async () => {
    const first = await loadPage();
    first.setIssueStatus("101", "נדחה", NOW);

    const second = await loadPage();

    expect(find(second, "101")).toMatchObject({ status: "נדחה", resolvedAt: "2026-11-15T09:00:00.000Z" });
  });

  it("changes several issues at once and leaves the others alone", async () => {
    const store = await loadPage();

    store.setIssuesStatus(["101", "102"], "בתהליך", NOW);

    expect(find(store, "101").status).toBe("בתהליך");
    expect(find(store, "102").status).toBe("בתהליך");
    expect(find(store, "104").status).toBe("בהמתנה");
  });

  it("deletes the photo once the grace period has passed, keeping the report", async () => {
    const store = await loadPage();
    const day = 24 * 60 * 60 * 1000;
    // Issue 103 has a photo and was resolved 3 days ago in the demo data.
    expect(find(store, "103").media).toBeDefined();

    expect(store.sweepMedia(Date.now() + 3 * day)).toBe(0); // 6 days: not yet
    expect(find(store, "103").media).toBeDefined();

    expect(store.sweepMedia(Date.now() + 5 * day)).toBe(1); // 8 days: due
    expect(find(store, "103")).toMatchObject({ title: "גיזום עצים בגינה הציבורית", status: "בוצע" });
    expect(find(store, "103").media).toBeUndefined();
    expect(find(store, "103").mediaRemovedAt).toBeDefined();
  });

  it("cancels a pending deletion when the status is moved back in time", async () => {
    const store = await loadPage();
    const day = 24 * 60 * 60 * 1000;

    store.setIssueStatus("103", "בתהליך");

    expect(store.sweepMedia(Date.now() + 30 * day)).toBe(0);
    expect(find(store, "103").media).toBeDefined();
  });

  it("deletes expired photos on load, as the scheduled job will", async () => {
    const day = 24 * 60 * 60 * 1000;
    storage.setItem(
      ISSUES_KEY,
      JSON.stringify({
        version: 2,
        data: [
          makeIssue({
            id: "200",
            status: "בוצע",
            resolvedAt: new Date(Date.now() - 8 * day).toISOString(),
            media: { type: "image", thumbnailUrl: "data:t", fullUrl: "data:f", alt: "x" },
          }),
        ],
      }),
    );

    const store = await loadPage();

    expect(find(store, "200").media).toBeUndefined();
    expect(JSON.parse(storage.getItem(ISSUES_KEY)!).data[0].mediaRemovedAt).toBeDefined();
  });

  it("the demo's fast-forward skips ahead 7 days for every resolved issue", async () => {
    const store = await loadPage();

    expect(store.fastForwardResolved(7 * 24 * 60 * 60 * 1000)).toBe(1);
    expect(find(store, "103").media).toBeUndefined();
  });
});

describe("admin: notes, deleting with undo, and resetting", () => {
  it("sets the public note trimmed, and a blank note removes it", async () => {
    const store = await loadPage();

    store.setAdminNote("104", "  הטכנאי יגיע מחר  ");
    expect(store.getIssues().find((i) => i.id === "104")?.adminNote).toBe("הטכנאי יגיע מחר");

    store.setAdminNote("104", "   ");
    expect(store.getIssues().find((i) => i.id === "104")?.adminNote).toBeUndefined();
  });

  it("deletes issues and gives them back for an undo", async () => {
    const store = await loadPage();

    const removed = store.deleteIssues(["101", "102"]);

    expect(removed.map((i) => i.id)).toEqual(["101", "102"]);
    expect(store.getIssues()).toHaveLength(11);

    store.restoreIssues(removed);
    expect(store.getIssues()).toHaveLength(13);
    expect(store.getIssues().find((i) => i.id === "101")).toBeDefined();
  });

  it("an undo never creates a duplicate id", async () => {
    const store = await loadPage();
    const [removed] = store.deleteIssues(["101"]);
    store.restoreIssues([removed]);

    store.restoreIssues([removed]);

    expect(store.getIssues().filter((i) => i.id === "101")).toHaveLength(1);
  });

  it("deleting survives a reload", async () => {
    const first = await loadPage();
    first.deleteIssues(["101"]);

    const second = await loadPage();

    expect(second.getIssues().find((i) => i.id === "101")).toBeUndefined();
    expect(second.getIssues()).toHaveLength(12);
  });

  it("reset brings the demo issues back and clears every posting cooldown", async () => {
    const store = await loadPage();
    store.createIssue(report(), ME, NOW);
    store.deleteIssues(["101"]);

    store.resetDemoIssues();

    expect(store.getIssues()).toHaveLength(13);
    expect(store.getLastPostAt(ME)).toBeNull();
  });
});
