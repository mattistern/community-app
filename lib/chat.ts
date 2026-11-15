/**
 * The private channel between an admin and the author of an issue (CLAUDE.md
 * §3). Pure rules; lib/local-chat keeps the data and enforces them. Only an
 * admin can open a thread, only that issue's author can answer it, and an admin
 * can lock it for good, after which nobody can write.
 */
import type { WhitelistRole } from "./whitelist";

export const CHAT_MESSAGE_MAX_LENGTH = 500;

export type ChatSender = WhitelistRole;

export interface ChatMessage {
  id: string;
  from: ChatSender;
  body: string;
  /** ISO timestamp. */
  createdAt: string;
}

export interface ChatThread {
  issueId: string;
  /** The issue's author: the only resident who can see and answer this thread. */
  residentPhone: string;
  messages: ChatMessage[];
  /** Permanently closed by an admin. */
  locked: boolean;
  lockedAt?: string;
  /** When the resident last opened the thread (ISO). */
  residentReadAt?: string;
  /** When an admin last opened the thread (ISO). */
  adminReadAt?: string;
}

export interface ChatActor {
  phone: string;
  role: WhitelistRole;
}

/** Null when the text can be sent, otherwise the Hebrew reason. */
export function validateChatMessage(body: string): string | null {
  const text = body.trim();
  if (text === "") return "יש לכתוב הודעה לפני השליחה";
  if (text.length > CHAT_MESSAGE_MAX_LENGTH) {
    return `ההודעה ארוכה מדי (עד ${CHAT_MESSAGE_MAX_LENGTH} תווים)`;
  }
  return null;
}

/** Why this person may not open a thread on the issue, or null if they may. */
export function startChatBlocker(
  actor: ChatActor | null,
  existing: ChatThread | undefined,
): string | null {
  if (!actor) return "יש להתחבר כדי לשלוח הודעות";
  if (actor.role !== "admin") return "רק מנהלי הקהילה יכולים לפתוח שיחה פרטית";
  if (existing) return "כבר קיימת שיחה פרטית עבור הפנייה הזו";
  return null;
}

/** Why this person may not write in the thread, or null if they may. */
export function sendBlocker(
  actor: ChatActor | null,
  thread: ChatThread | undefined,
): string | null {
  if (!actor) return "יש להתחבר כדי לשלוח הודעות";
  if (!thread) return "השיחה לא קיימת";
  if (thread.locked) return "השיחה ננעלה על ידי הנהלה ואי אפשר להוסיף בה הודעות";
  if (actor.role === "admin") return null;
  if (actor.phone !== thread.residentPhone) return "אין לך גישה לשיחה הזו";
  return null;
}

/** Whether this person may open and read the thread. */
export function canViewThread(
  actor: ChatActor | null,
  thread: ChatThread,
): boolean {
  if (!actor) return false;
  return actor.role === "admin" || actor.phone === thread.residentPhone;
}

const time = (iso: string) => Date.parse(iso);

/** The resident has an admin message they have not opened yet. */
export function hasUnreadForResident(thread: ChatThread): boolean {
  const readAt = thread.residentReadAt ? time(thread.residentReadAt) : -Infinity;
  return thread.messages.some(
    (message) => message.from === "admin" && time(message.createdAt) > readAt,
  );
}

/** The resident wrote something an admin has not opened yet. */
export function hasUnreadForAdmin(thread: ChatThread): boolean {
  const readAt = thread.adminReadAt ? time(thread.adminReadAt) : -Infinity;
  return thread.messages.some(
    (message) => message.from === "resident" && time(message.createdAt) > readAt,
  );
}

/** Threads with admin messages this resident has not read, newest message first. */
export function unreadThreadsForResident(
  threads: readonly ChatThread[],
  phone: string,
): ChatThread[] {
  const lastAt = (thread: ChatThread) =>
    time(thread.messages[thread.messages.length - 1]?.createdAt ?? "1970-01-01");
  return threads
    .filter(
      (thread) => thread.residentPhone === phone && hasUnreadForResident(thread),
    )
    .sort((a, b) => lastAt(b) - lastAt(a));
}
