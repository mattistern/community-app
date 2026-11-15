"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Trash2, X } from "lucide-react";
import { MediaThumbnail } from "@/components/feed/media-thumbnail";
import { UrgencyScore } from "@/components/feed/urgency-score";
import { DialogSheet } from "@/components/ui/dialog-sheet";
import { ADMIN_NOTE_MAX_LENGTH, validateAdminNote } from "@/lib/admin-issues";
import { formatDateTime } from "@/lib/format-time";
import type { Issue, IssueStatus } from "@/lib/types";
import { urgencyScore } from "@/lib/urgency";
import { LifecycleChip } from "./lifecycle-chip";
import { StatusSelect } from "./status-select";

interface IssueDetailsDialogProps {
  issue: Issue;
  now: number;
  onStatusChange: (status: IssueStatus) => void;
  onSaveNote: (note: string) => void;
  /** Asks to delete this issue (the manager confirms); the dialog closes itself. */
  onDelete: () => void;
  /** The dialog has closed: unmount it here. */
  onClose: () => void;
}

/**
 * One report in full, for the admin: its details, the status, and the official
 * public note (הערת הנהלה רשמית) that shows on the card in the feed.
 */
export function IssueDetailsDialog({
  issue,
  now,
  onStatusChange,
  onSaveNote,
  onDelete,
  onClose,
}: IssueDetailsDialogProps) {
  const id = useId();
  const [note, setNote] = useState(issue.adminNote ?? "");
  const [saved, setSaved] = useState<string | null>(null);

  const error = validateAdminNote(note);
  const dirty = note.trim() !== (issue.adminNote ?? "");

  function save() {
    if (error) return;
    onSaveNote(note);
    setSaved(
      note.trim() === ""
        ? "ההערה הוסרה מהכרטיס בפיד."
        : "ההערה נשמרה והיא מופיעה בכרטיס בפיד.",
    );
  }

  return (
    <DialogSheet labelledBy={`${id}-title`} size="lg" onClose={onClose}>
      {({ close }) => (
        <>
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 py-2 ps-4 pe-2">
            <h2 id={`${id}-title`} className="text-lg font-extrabold tracking-tight text-slate-900">
              פנייה <span className="tabular-nums">#{issue.id}</span>
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="סגור"
              className="grid size-11 shrink-0 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <X aria-hidden className="size-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
            <div>
              <h3 className="text-lg font-bold leading-snug text-slate-900">{issue.title}</h3>
              <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-slate-500">קטגוריה</dt>
                <dd className="text-slate-800">{issue.category ?? "—"}</dd>
                <dt className="text-slate-500">מיקום</dt>
                <dd className="text-slate-800">{issue.location ?? "—"}</dd>
                <dt className="text-slate-500">טלפון המדווח</dt>
                <dd className="text-slate-800">
                  <bdi dir="ltr" className="tabular-nums">{issue.authorPhone}</bdi>
                </dd>
                <dt className="text-slate-500">נפתחה</dt>
                <dd className="text-slate-800">{formatDateTime(issue.createdAt)}</dd>
                <dt className="text-slate-500">דחיפות</dt>
                <dd className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-800">
                  <UrgencyScore ratingSum={issue.ratingSum} voteCount={issue.voteCount} />
                  <span className="text-slate-500">
                    ציון משוקלל <span className="tabular-nums">{urgencyScore(issue).toFixed(2)}</span>
                  </span>
                </dd>
              </dl>
            </div>

            <p className="text-sm leading-relaxed text-slate-700">{issue.description}</p>

            {/* What the admin came to do (status, note) comes before the photo, which only needs a glance. */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">סטטוס</p>
              <StatusSelect
                size="md"
                value={issue.status}
                label={`סטטוס של פנייה #${issue.id}`}
                onChange={onStatusChange}
              />
              <p className="mt-2 text-xs text-slate-500">
                {'סטטוס "בוצע" או "נדחה" מתחיל ספירה של 7 ימים עד למחיקת התמונה. החזרה לסטטוס פתוח מבטלת אותה.'}
              </p>
              <div className="mt-2 empty:hidden">
                <LifecycleChip issue={issue} now={now} />
              </div>
            </div>

            <div>
              <label htmlFor={`${id}-note`} className="mb-1 block text-sm font-semibold text-slate-900">
                הערת הנהלה רשמית
              </label>
              <p className="mb-2 text-xs text-slate-500">
                ההערה פומבית ומוצגת בכרטיס הפנייה בפיד. אפשר להשאיר ריק.
              </p>
              <textarea
                id={`${id}-note`}
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setSaved(null);
                }}
                rows={3}
                maxLength={ADMIN_NOTE_MAX_LENGTH}
                placeholder="למשל: הועבר לקבלן, צפי לתיקון עד סוף השבוע"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-note-error` : undefined}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <div className="mt-1.5 flex items-start justify-between gap-3">
                {error ? (
                  <p id={`${id}-note-error`} className="text-sm text-red-700">{error}</p>
                ) : (
                  <p role="status" className="text-sm font-medium text-emerald-700">{saved}</p>
                )}
                <span className="shrink-0 text-xs tabular-nums text-slate-500">
                  {note.length}/{ADMIN_NOTE_MAX_LENGTH}
                </span>
              </div>
              <button
                type="button"
                onClick={save}
                disabled={!dirty || Boolean(error)}
                className="mt-3 h-11 rounded-xl bg-blue-600 px-5 text-base font-bold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                שמירת הערה
              </button>
            </div>

            {issue.media && (
              <div className="max-w-xs">
                <p className="text-sm font-semibold text-slate-900">תמונה מצורפת</p>
                <MediaThumbnail media={issue.media} />
              </div>
            )}
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => {
                onDelete();
                close();
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <Trash2 aria-hidden className="size-4" />
              מחיקת הפנייה
            </button>
            <div className="flex items-center gap-2">
              <Link
                href={`/issue/${issue.id}`}
                className="grid h-11 place-items-center rounded-xl px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                עמוד הפנייה ותגובות
              </Link>
              <button
                type="button"
                onClick={close}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-base font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                סגור
              </button>
            </div>
          </footer>
        </>
      )}
    </DialogSheet>
  );
}
