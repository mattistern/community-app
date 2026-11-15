"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Lock, LockKeyhole, MessagesSquare, Send } from "lucide-react";
import { RelativeTime } from "@/components/feed/relative-time";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  CHAT_MESSAGE_MAX_LENGTH,
  canViewThread,
  hasUnreadForAdmin,
  hasUnreadForResident,
  validateChatMessage,
  type ChatThread,
} from "@/lib/chat";
import {
  ChatError,
  lockChat,
  markChatRead,
  sendChatMessage,
  startChat,
  useChats,
} from "@/lib/local-chat";
import type { Session } from "@/lib/local-session";
import { StorageFullError } from "@/lib/persisted-store";
import type { Issue } from "@/lib/types";

function errorText(error: unknown): string {
  if (error instanceof ChatError) return error.message;
  if (error instanceof StorageFullError) {
    return "אין מספיק מקום באחסון הדפדפן לשמירת ההודעה";
  }
  return "לא הצלחנו לשלוח את ההודעה. נסו שוב.";
}

/** The message box. `onSend` throws (with a Hebrew message) when the data layer refuses. */
function Composer({
  label,
  placeholder,
  submitLabel,
  onSend,
}: {
  label: string;
  placeholder: string;
  submitLabel: string;
  onSend: (body: string) => void;
}) {
  const id = useId();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validateChatMessage(body);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      onSend(body);
      setBody("");
      setError(null);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor={`${id}-body`} className="sr-only">
        {label}
      </label>
      <textarea
        id={`${id}-body`}
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          setError(null);
        }}
        rows={3}
        maxLength={CHAT_MESSAGE_MAX_LENGTH}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        // 16px: iOS Safari zooms the page when a smaller field gets focus.
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
      />
      <div className="flex items-start justify-between gap-3">
        <p id={`${id}-error`} role="alert" className="min-h-5 text-sm font-medium text-red-700">
          {error}
        </p>
        <span className="shrink-0 text-xs tabular-nums text-slate-500">
          {body.length}/{CHAT_MESSAGE_MAX_LENGTH}
        </span>
      </div>
      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <Send aria-hidden className="size-4 -scale-x-100" />
        {submitLabel}
      </button>
    </form>
  );
}

function Thread({ thread, session }: { thread: ChatThread; session: Session }) {
  const isAdmin = session.role === "admin";
  const [confirmingLock, setConfirmingLock] = useState(false);
  const unread = isAdmin ? hasUnreadForAdmin(thread) : hasUnreadForResident(thread);
  const count = thread.messages.length;

  // Having the thread open is reading it, including messages that arrive meanwhile.
  useEffect(() => {
    if (unread) markChatRead(thread.issueId);
  }, [unread, count, thread.issueId]);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {thread.messages.map((message) => {
          const mine = message.from === session.role;
          return (
            <li
              key={message.id}
              className={
                mine
                  ? "me-auto max-w-[85%] rounded-2xl rounded-ss-sm bg-blue-600 px-3 py-2 text-white"
                  : "ms-auto max-w-[85%] rounded-2xl rounded-se-sm border border-slate-200 bg-white px-3 py-2 text-slate-800"
              }
            >
              <p className="text-xs font-semibold opacity-80">
                {message.from === "admin" ? "הנהלה" : isAdmin ? "המדווח" : "אני"}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.body}
              </p>
              <RelativeTime
                iso={message.createdAt}
                className="mt-1 block text-xs opacity-70"
              />
            </li>
          );
        })}
      </ul>

      {thread.locked ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700"
        >
          <Lock aria-hidden className="size-4 shrink-0" />
          השיחה ננעלה על ידי הנהלה. אי אפשר להוסיף בה הודעות.
        </p>
      ) : (
        <>
          <Composer
            label="כתיבת הודעה"
            placeholder="כתבו הודעה…"
            submitLabel="שלח הודעה"
            onSend={(body) => sendChatMessage(thread.issueId, body)}
          />
          {isAdmin && (
            <button
              type="button"
              onClick={() => setConfirmingLock(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <LockKeyhole aria-hidden className="size-4" />
              נעילת השיחה
            </button>
          )}
        </>
      )}

      {confirmingLock && (
        <ConfirmDialog
          title="לנעול את השיחה?"
          message="אחרי הנעילה אף אחד לא יוכל להוסיף הודעות, והפעולה לא ניתנת לביטול."
          confirmLabel="נעל שיחה"
          tone="danger"
          onConfirm={() => lockChat(thread.issueId)}
          onClose={() => setConfirmingLock(false)}
        />
      )}
    </div>
  );
}

/**
 * The private channel on an issue page. An admin can open it with a first
 * message, then both sides write until an admin locks it. Residents see it only
 * on their own issue, and only once an admin has started it.
 */
export function ChatPanel({ issue, session }: { issue: Issue; session: Session }) {
  const id = useId();
  const chats = useChats();
  if (chats === null) return null;

  const thread = chats.find((candidate) => candidate.issueId === issue.id);
  const isAdmin = session.role === "admin";
  if (!thread && !isAdmin) return null;
  if (thread && !canViewThread(session, thread)) return null;

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div>
        <h2
          id={`${id}-title`}
          className="flex items-center gap-2 text-base font-bold text-slate-900"
        >
          <MessagesSquare aria-hidden className="size-5 text-slate-500" />
          {isAdmin ? "שיחה פרטית עם המדווח" : "שיחה פרטית עם ההנהלה"}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {isAdmin
            ? "ההודעות האלה גלויות רק לך ולמי שפתח את הפנייה."
            : "ההודעות האלה גלויות רק לך ולהנהלה."}
        </p>
      </div>

      {thread ? (
        <Thread thread={thread} session={session} />
      ) : (
        <Composer
          label="הודעה ראשונה למדווח"
          placeholder="כתבו הודעה למדווח…"
          submitLabel="פתח שיחה ושלח"
          onSend={(body) => startChat(issue, body)}
        />
      )}
    </section>
  );
}
