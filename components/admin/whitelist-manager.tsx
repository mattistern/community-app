"use client";

import { useCallback, useId, useRef, useState, type FormEvent } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { Toast } from "@/components/feed/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format-time";
import {
  addToWhitelist,
  removeFromWhitelist,
  useWhitelist,
} from "@/lib/local-whitelist";
import { PHONE_FORMAT_HINT } from "@/lib/phone";
import { canRemove } from "@/lib/whitelist";

/** ניהול מורשים: the phone numbers that may sign in to the community. */
export function WhitelistManager() {
  const entries = useWhitelist();
  const id = useId();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastCounter = useRef(0);
  const dismissToast = useCallback(() => setToast(null), []);
  const inputRef = useRef<HTMLInputElement>(null);

  if (entries === null) {
    return (
      <div role="status" className="animate-pulse space-y-4 motion-reduce:animate-none">
        <span className="sr-only">טוען רשימה…</span>
        <div aria-hidden className="h-8 w-56 rounded bg-slate-200" />
        <div aria-hidden className="h-64 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  const showToast = (message: string) =>
    setToast({ id: ++toastCounter.current, message });

  // Admins first, then the most recently added.
  const sorted = [...entries].sort(
    (a, b) =>
      Number(b.role === "admin") - Number(a.role === "admin") ||
      Date.parse(b.addedAt) - Date.parse(a.addedAt),
  );

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const result = addToWhitelist(input);
    if (!result.ok) {
      setError(result.error);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setInput("");
    showToast(`המספר ${result.phone} נוסף לרשימה.`);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          ניהול מורשים - Whitelist
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
          מספרי הטלפון שמורשים להיכנס לקהילה. בגרסת הניסוי עדיין אין כניסה בטלפון,
          ולכן הרשימה נשמרת בדפדפן הזה בלבד ועדיין לא מגבילה אף אחד.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        noValidate
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <label htmlFor={`${id}-phone`} className="mb-2 block text-sm font-semibold text-slate-900">
          הוסף מספר טלפון
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={`${id}-phone`}
            ref={inputRef}
            type="tel"
            inputMode="tel"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            placeholder={`מספר טלפון (${PHONE_FORMAT_HINT})`}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            // 16px text: iOS Safari zooms the page when a field with smaller text gets focus.
            className={cn(
              "h-12 min-w-0 flex-[1_1_14rem] rounded-xl border bg-white px-3 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20",
            )}
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-base font-bold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <UserPlus aria-hidden className="size-5" />
            הוסף
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>

      <section aria-labelledby={`${id}-list`}>
        <h2 id={`${id}-list`} className="mb-3 text-base font-bold text-slate-900">
          מורשים ({entries.length})
        </h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <caption className="sr-only">מספרי הטלפון המורשים</caption>
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="py-3 ps-4 pe-3 text-start font-semibold">מספר טלפון</th>
                <th scope="col" className="py-3 pe-3 text-start font-semibold">תפקיד</th>
                <th scope="col" className="hidden py-3 pe-3 text-start font-semibold sm:table-cell">נוסף ב</th>
                <th scope="col" className="py-3 pe-4 text-start font-semibold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr key={entry.phone} className="border-t border-slate-100">
                  <td className="py-3 ps-4 pe-3 font-semibold text-slate-900">
                    <bdi dir="ltr" className="tabular-nums">{entry.phone}</bdi>
                  </td>
                  <td className="py-3 pe-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        entry.role === "admin"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {entry.role === "admin" ? "מנהל" : "תושב"}
                    </span>
                  </td>
                  <td className="hidden py-3 pe-3 text-slate-600 sm:table-cell">
                    {formatDateTime(entry.addedAt)}
                  </td>
                  <td className="py-2 pe-4">
                    {canRemove(entry) ? (
                      <button
                        type="button"
                        onClick={() => setRemoving(entry.phone)}
                        aria-label={`הסר גישה: ${entry.phone}`}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        <Trash2 aria-hidden className="size-4" />
                        הסר גישה
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">מוגדר בהגדרות המערכת</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {removing && (
        <ConfirmDialog
          title="הסרת גישה"
          message={
            <>
              המספר <bdi dir="ltr" className="font-semibold tabular-nums">{removing}</bdi> לא
              יוכל יותר להיכנס לקהילה.
            </>
          }
          confirmLabel="הסר גישה"
          tone="danger"
          onConfirm={() => {
            removeFromWhitelist(removing);
            showToast(`הגישה של ${removing} הוסרה.`);
          }}
          onClose={() => setRemoving(null)}
        />
      )}

      {toast && <Toast key={toast.id} message={toast.message} onDismiss={dismissToast} />}
    </div>
  );
}
