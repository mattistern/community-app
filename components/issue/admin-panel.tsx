"use client";

import { useId, useState } from "react";
import { LifecycleChip } from "@/components/admin/lifecycle-chip";
import { StatusSelect } from "@/components/admin/status-select";
import { ADMIN_NOTE_MAX_LENGTH, validateAdminNote } from "@/lib/admin-issues";
import { setAdminNote, setIssueStatus } from "@/lib/local-issues";
import type { Issue } from "@/lib/types";
import { useNow } from "@/lib/use-minute-clock";

/**
 * What an admin sees on an issue page, above the comments: the status control
 * and the official public note. Changes are saved at once and show in the feed.
 */
export function AdminPanel({ issue }: { issue: Issue }) {
  const id = useId();
  const now = useNow();
  const [note, setNote] = useState(issue.adminNote ?? "");
  const [saved, setSaved] = useState<string | null>(null);

  const error = validateAdminNote(note);
  const dirty = note.trim() !== (issue.adminNote ?? "");

  function save() {
    if (error) return;
    setAdminNote(issue.id, note);
    setSaved(
      note.trim() === ""
        ? "ההערה הוסרה מהכרטיס בפיד."
        : "ההערה נשמרה והיא מופיעה בכרטיס בפיד.",
    );
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4"
    >
      <h2 id={`${id}-title`} className="text-base font-bold text-slate-900">
        ניהול הפנייה
      </h2>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">סטטוס</p>
        <StatusSelect
          size="md"
          value={issue.status}
          label={`סטטוס של פנייה #${issue.id}`}
          onChange={(status) => setIssueStatus(issue.id, status)}
        />
        <p className="mt-2 text-xs text-slate-600">
          {'סטטוס "בוצע" או "נדחה" מתחיל ספירה של 7 ימים עד למחיקת התמונה. החזרה לסטטוס פתוח מבטלת אותה.'}
        </p>
        {now !== null && (
          <div className="mt-2 empty:hidden">
            <LifecycleChip issue={issue} now={now} />
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor={`${id}-note`}
          className="mb-1 block text-sm font-semibold text-slate-900"
        >
          הערת הנהלה רשמית
        </label>
        <p className="mb-2 text-xs text-slate-600">
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
            <p id={`${id}-note-error`} className="text-sm text-red-700">
              {error}
            </p>
          ) : (
            <p role="status" className="text-sm font-medium text-emerald-700">
              {saved}
            </p>
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
    </section>
  );
}
