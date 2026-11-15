"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DialogSheet } from "./dialog-sheet";

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  /** "danger" paints the confirm button red (deleting, removing access). */
  tone?: "danger" | "default";
  /** The person confirmed; runs just before the dialog closes. */
  onConfirm: () => void;
  /** The dialog has closed, whichever button closed it: unmount it here. */
  onClose: () => void;
}

/** An in-app confirmation (a browser confirm() would show its buttons in the browser's language, not Hebrew). */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = "default",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();

  return (
    <DialogSheet variant="center" labelledBy={titleId} onClose={onClose}>
      {({ close }) => (
        <div className="p-5">
          <h2 id={titleId} className="text-lg font-extrabold text-slate-900">
            {title}
          </h2>
          <div className="mt-2 text-sm leading-relaxed text-slate-600">
            {message}
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onConfirm();
                close();
              }}
              className={cn(
                "h-11 flex-1 rounded-xl text-base font-bold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2",
                tone === "danger"
                  ? "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600"
                  : "bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600",
              )}
            >
              {confirmLabel}
            </button>
            {/* The safe choice has the focus, so a stray Enter can't delete anything. */}
            <button
              type="button"
              data-autofocus
              onClick={close}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </DialogSheet>
  );
}
