"use client";

import { useId, useState, type FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import { RelativeTime } from "@/components/feed/relative-time";
import {
  COMMENT_MAX_LENGTH,
  commentsForIssue,
  validateComment,
} from "@/lib/comments";
import { addComment, useComments } from "@/lib/local-comments";
import type { Session } from "@/lib/local-session";
import { StorageFullError } from "@/lib/persisted-store";

interface CommentsSectionProps {
  issueId: string;
  session: Session;
}

/** Comments under one issue, plus the form for adding one. Saved in this browser. */
export function CommentsSection({ issueId, session }: CommentsSectionProps) {
  const id = useId();
  const all = useComments();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const comments = all === null ? [] : commentsForIssue(all, issueId);

  function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validateComment(body);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      addComment(issueId, body, session);
      setBody("");
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof StorageFullError
          ? "אין מספיק מקום באחסון הדפדפן לשמירת התגובה"
          : "לא הצלחנו לשלוח את התגובה. נסו שוב.",
      );
    }
  }

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4">
      <h2
        id={`${id}-title`}
        className="flex items-center gap-2 text-base font-bold text-slate-900"
      >
        <MessageCircle aria-hidden className="size-5 text-slate-500" />
        תגובות
        {comments.length > 0 && (
          <span className="text-sm font-medium tabular-nums text-slate-500">
            ({comments.length})
          </span>
        )}
      </h2>

      {all !== null && comments.length === 0 && (
        <p className="rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-600">
          עדיין אין תגובות. אפשר להיות הראשונים.
        </p>
      )}

      {comments.length > 0 && (
        <ul className="space-y-2.5">
          {comments.map((comment) => {
            const fromAdmin = comment.authorRole === "admin";
            const mine = comment.authorPhone === session.phone;
            return (
              <li
                key={comment.id}
                className={
                  fromAdmin
                    ? "rounded-xl border border-blue-200 bg-blue-50 p-3"
                    : "rounded-xl border border-slate-200 bg-white p-3"
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {fromAdmin ? "הנהלה" : mine ? "אני" : "תושב"}
                    {fromAdmin && (
                      <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-xs font-bold text-white">
                        רשמי
                      </span>
                    )}
                  </span>
                  <RelativeTime
                    iso={comment.createdAt}
                    className="text-xs text-slate-500"
                  />
                </div>
                <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                  {comment.body}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="space-y-2">
        <label htmlFor={`${id}-body`} className="sr-only">
          כתיבת תגובה
        </label>
        <textarea
          id={`${id}-body`}
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setError(null);
          }}
          rows={3}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder="כתבו תגובה…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          // 16px: iOS Safari zooms the page when a smaller field gets focus.
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        />
        <div className="flex items-start justify-between gap-3">
          <p
            id={`${id}-error`}
            role="alert"
            className="min-h-5 text-sm font-medium text-red-700"
          >
            {error}
          </p>
          <span className="shrink-0 text-xs tabular-nums text-slate-500">
            {body.length}/{COMMENT_MAX_LENGTH}
          </span>
        </div>
        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Send aria-hidden className="size-4 -scale-x-100" />
          שלח תגובה
        </button>
      </form>
    </section>
  );
}
