"use client";

import { useState } from "react";
import { CalendarClock, FlaskConical, RotateCcw, Timer, X } from "lucide-react";
import { DialogSheet } from "@/components/ui/dialog-sheet";
import {
  clearLastPostAt,
  fastForwardResolved,
  resetDemoIssues,
} from "@/lib/local-issues";
import { resetChats } from "@/lib/local-chat";
import { resetWhitelist } from "@/lib/local-whitelist";
import { MEDIA_GRACE_PERIOD_MS } from "@/lib/media-cleanup";
import { MOCK_CURRENT_USER_PHONE } from "@/lib/mock-issues";

function describeFastForward(removed: number): string {
  if (removed === 0) return "עברו 7 ימים. אין מדיה שהגיעה למחיקה.";
  if (removed === 1) return "עברו 7 ימים. המדיה של דיווח אחד נמחקה.";
  return `עברו 7 ימים. המדיה של ${removed} דיווחים נמחקה.`;
}

function DemoDialog({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <DialogSheet labelledBy="demo-tools-title" onClose={onClose}>
      {({ close }) => (
        <>
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 py-2 ps-4 pe-2">
            <h2
              id="demo-tools-title"
              className="text-lg font-extrabold tracking-tight text-slate-900"
            >
              כלי הדגמה
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
            <p className="text-sm leading-relaxed text-slate-600">
              כלים לבדיקות בגרסת הניסוי המקומית. הנתונים נשמרים בדפדפן הזה בלבד,
              והכלים האלה יוסרו כשהמערכת תתחבר לשרת.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  setMessage(describeFastForward(fastForwardResolved(MEDIA_GRACE_PERIOD_MS)))
                }
                className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-start transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <CalendarClock aria-hidden className="mt-0.5 size-5 shrink-0 text-slate-500" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    דמה חלוף של 7 ימים
                  </span>
                  <span className="block text-sm text-slate-600">
                    מקדים את שעון תקופת ההמתנה לפני מחיקת מדיה של פניות שטופלו, ומריץ את הניקוי
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clearLastPostAt(MOCK_CURRENT_USER_PHONE);
                  setMessage("מגבלת הדיווח אופסה. אפשר לדווח שוב מיד.");
                }}
                className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-start transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <Timer aria-hidden className="mt-0.5 size-5 shrink-0 text-slate-500" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    אפס את מגבלת הדיווח
                  </span>
                  <span className="block text-sm text-slate-600">
                    בין דיווח לדיווח צריכה לעבור דקה; כאן אפשר לדלג על ההמתנה
                  </span>
                </span>
              </button>

              {confirmingReset ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-900">
                    בטוחים? כל הדיווחים, ההצבעות והמורשים המקומיים יחזרו למצב ההתחלתי.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetDemoIssues();
                        resetWhitelist();
                        resetChats();
                        setConfirmingReset(false);
                        setMessage("נתוני הדמו אופסו.");
                      }}
                      className="h-10 flex-1 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    >
                      כן, אפס
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingReset(false)}
                      className="h-10 flex-1 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingReset(true)}
                  className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-start transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <RotateCcw aria-hidden className="mt-0.5 size-5 shrink-0 text-slate-500" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      איפוס נתוני דמו
                    </span>
                    <span className="block text-sm text-slate-600">
                      מוחק את כל השינויים המקומיים וטוען מחדש את נתוני ההתחלה
                    </span>
                  </span>
                </button>
              )}
            </div>

            <p role="status" className="min-h-5 text-sm font-medium text-emerald-700">
              {message}
            </p>
          </div>
        </>
      )}
    </DialogSheet>
  );
}

interface DemoToolsProps {
  /** "icon": a round button for the feed header. "row": a full-width row for the admin menu. */
  variant?: "icon" | "row";
}

/** Prototype-only tools: switch between resident and admin, reset the data, skip ahead in time. */
export function DemoTools({ variant = "icon" }: DemoToolsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="כלי הדגמה"
          title="כלי הדגמה"
          className="grid size-11 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <FlaskConical aria-hidden className="size-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <FlaskConical aria-hidden className="size-5" />
          כלי הדגמה
        </button>
      )}
      {open && <DemoDialog onClose={() => setOpen(false)} />}
    </>
  );
}
