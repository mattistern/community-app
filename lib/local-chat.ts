/**
 * Private admin-to-author chat threads, kept in this browser's localStorage like
 * the rest of the prototype's data. This module stands in for the server: every
 * operation checks who is signed in and refuses what the rules forbid, so the
 * screens hiding a button is never the only protection (CLAUDE.md "Admin Chat Lock").
 */
import {
  sendBlocker,
  startChatBlocker,
  validateChatMessage,
  type ChatMessage,
  type ChatSender,
  type ChatThread,
} from "./chat";
import { getIssues } from "./local-issues";
import { getSession } from "./local-session";
import { createPersistedStore } from "./persisted-store";
import type { Issue } from "./types";

/** A refused chat operation; the message is Hebrew and fit to show. */
export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatError";
  }
}

const store = createPersistedStore<ChatThread[]>({
  key: "community-app:chats",
  version: 1,
  seed: () => [],
  // A private thread must never outlive its issue: a new issue can be given a
  // deleted one's id, and would show the old conversation to a stranger.
  onLoad: (threads) => {
    const live = new Set(getIssues().map((issue) => issue.id));
    const kept = threads.filter((thread) => live.has(thread.issueId));
    return kept.length === threads.length ? threads : kept;
  },
});

/** The threads, or null until the browser has loaded them (and on the server). */
export const useChats = store.useValue;

function newMessage(from: ChatSender, body: string, now: number): ChatMessage {
  return {
    // crypto.randomUUID is missing on http LAN addresses, so build the id by hand.
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    from,
    body: body.trim(),
    createdAt: new Date(now).toISOString(),
  };
}

function replaceThread(next: ChatThread): void {
  store.set(
    store.get().map((thread) => (thread.issueId === next.issueId ? next : thread)),
    { strict: true },
  );
}

/** Admin only: opens the private thread with the issue's author, with a first message. */
export function startChat(
  issue: Issue,
  body: string,
  now: number = Date.now(),
): ChatThread {
  const session = getSession();
  const existing = store.get().find((thread) => thread.issueId === issue.id);
  const refused = startChatBlocker(session, existing) ?? validateChatMessage(body);
  if (refused) throw new ChatError(refused);

  const thread: ChatThread = {
    issueId: issue.id,
    residentPhone: issue.authorPhone,
    messages: [newMessage("admin", body, now)],
    locked: false,
    // The admin who wrote it has, of course, seen it.
    adminReadAt: new Date(now).toISOString(),
  };
  store.set([...store.get(), thread], { strict: true });
  return thread;
}

/** The author or an admin writes in an open thread; a locked one refuses everyone. */
export function sendChatMessage(
  issueId: string,
  body: string,
  now: number = Date.now(),
): void {
  const session = getSession();
  const thread = store.get().find((candidate) => candidate.issueId === issueId);
  const refused = sendBlocker(session, thread) ?? validateChatMessage(body);
  if (refused || !session || !thread) throw new ChatError(refused ?? "השיחה לא קיימת");

  const iso = new Date(now).toISOString();
  replaceThread({
    ...thread,
    messages: [...thread.messages, newMessage(session.role, body, now)],
    // Writing a message counts as having read everything so far.
    ...(session.role === "admin" ? { adminReadAt: iso } : { residentReadAt: iso }),
  });
}

/** Admin only: closes the thread permanently. */
export function lockChat(issueId: string, now: number = Date.now()): void {
  const session = getSession();
  if (session?.role !== "admin") {
    throw new ChatError("רק מנהלי הקהילה יכולים לנעול שיחה");
  }
  const thread = store.get().find((candidate) => candidate.issueId === issueId);
  if (!thread || thread.locked) return;
  replaceThread({ ...thread, locked: true, lockedAt: new Date(now).toISOString() });
}

/** The signed-in person has opened the thread: what is in it now is no longer unread. */
export function markChatRead(issueId: string, now: number = Date.now()): void {
  const session = getSession();
  const thread = store.get().find((candidate) => candidate.issueId === issueId);
  if (!session || !thread) return;

  const iso = new Date(now).toISOString();
  try {
    if (session.role === "admin") {
      replaceThread({ ...thread, adminReadAt: iso });
    } else if (session.phone === thread.residentPhone) {
      replaceThread({ ...thread, residentReadAt: iso });
    }
  } catch {
    // Storage full: the thread just stays marked unread; nothing to tell the reader.
  }
}

/** Removes (and returns) the threads of the given issues, e.g. when they are deleted. */
export function takeChatsForIssues(issueIds: readonly string[]): ChatThread[] {
  const ids = new Set(issueIds);
  const all = store.get();
  const taken = all.filter((thread) => ids.has(thread.issueId));
  if (taken.length > 0) store.set(all.filter((thread) => !ids.has(thread.issueId)));
  return taken;
}

/** Puts threads back (the admin's undo of a deletion); one whose issue has since been given a new thread is skipped. */
export function restoreChats(taken: readonly ChatThread[]): void {
  const have = new Set(store.get().map((thread) => thread.issueId));
  const back = taken.filter((thread) => !have.has(thread.issueId));
  if (back.length > 0) store.set([...store.get(), ...back]);
}

/** Demo: removes every thread. */
export function resetChats(): void {
  store.set([]);
}
