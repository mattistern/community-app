"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

const DEFAULT_VISIBLE_MS = 4500;

interface ToastProps {
  message: string;
  /** Should keep the same identity between renders, or the timer restarts. */
  onDismiss: () => void;
  /** An optional button, e.g. "ביטול" to undo what just happened. */
  action?: { label: string; onClick: () => void };
  /** How long it stays; give an undo a little longer. */
  visibleMs?: number;
}

/** Brief confirmation above the bottom of the screen; dismisses itself. */
export function Toast({
  message,
  onDismiss,
  action,
  visibleMs = DEFAULT_VISIBLE_MS,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, visibleMs);
    return () => clearTimeout(timer);
  }, [onDismiss, visibleMs]);

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-sm items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
    >
      <CheckCircle2 aria-hidden className="size-5 shrink-0 text-emerald-400" />
      <span className="flex-1">{message}</span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            onDismiss();
          }}
          className="shrink-0 rounded-lg px-2 py-1 font-bold text-blue-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
