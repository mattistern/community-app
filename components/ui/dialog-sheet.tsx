"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

let openDialogs = 0;
let overflowBeforeLock = "";

/**
 * Keeps the page from scrolling behind a dialog. Two dialogs can be open at once
 * for a moment (the details dialog hands over to a delete confirmation), so the
 * page is locked by the first and released only by the last; each one restoring
 * "what it saw" would leave the page stuck once they close out of order.
 * Returns the unlock function.
 */
function lockPageScroll(): () => void {
  const root = document.documentElement;
  if (openDialogs++ === 0) {
    overflowBeforeLock = root.style.overflow;
    root.style.overflow = "hidden";
  }
  return () => {
    if (--openDialogs === 0) root.style.overflow = overflowBeforeLock;
  };
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Calls the render prop from its own component, so passing it a callback is plainly an event handler. */
function Content({
  render,
  close,
}: {
  render: DialogSheetProps["children"];
  close: () => void;
}) {
  return <>{render({ close })}</>;
}

interface DialogSheetProps {
  /** Id of the heading inside that names the dialog. */
  labelledBy: string;
  /** Called when the dialog closes (button, Escape or a tap on the dimmed area). */
  onClose: () => void;
  /** Set to false while Escape and outside taps must be refused, e.g. while a report is being sent. */
  canClose?: boolean;
  /**
   * "sheet": a bottom sheet on phones, centered from md up.
   * "center": a small centered card on every screen (confirmations).
   */
  variant?: "sheet" | "center";
  /** Width from md up for the sheet variant. */
  size?: "md" | "lg";
  /** Content; `close` closes the dialog (and so calls `onClose`). */
  children: (api: { close: () => void }) => ReactNode;
}

/**
 * The app's modal dialog. It is drawn in a portal on <body> as a full-screen
 * fixed layer, so no parent (a sticky blurred header, say) can trap or clip it,
 * and it behaves the same in every mobile browser. Mount it only while it should
 * be open: it starts every time with fresh state. An element marked
 * `data-autofocus` gets the focus first. Escape and Tab are handled here.
 */
export function DialogSheet({
  labelledBy,
  onClose,
  canClose = true,
  variant = "sheet",
  size = "md",
  children,
}: DialogSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Latest props for the key handler, which is attached once.
  const latest = useRef({ canClose, onClose });
  useEffect(() => {
    latest.current = { canClose, onClose };
  });

  useEffect(() => {
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    (
      panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel
    )?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // Only the topmost dialog reacts.
        if (!panel || panel.parentElement?.nextElementSibling) return;
        event.preventDefault();
        if (latest.current.canClose) latest.current.onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const unlock = lockPageScroll();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlock();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center",
        variant === "sheet" ? "items-end md:items-center" : "items-center p-4",
      )}
    >
      {/* Dimmed backdrop: a tap outside closes, unless closing is refused. */}
      <div
        aria-hidden
        onClick={() => {
          if (canClose) onClose();
        }}
        className="absolute inset-0 bg-slate-900/50"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          "relative flex w-full flex-col overflow-hidden bg-white text-slate-600 shadow-2xl outline-none",
          variant === "sheet" &&
            cn(
              "max-h-[92dvh] max-w-md rounded-t-3xl md:max-h-[88dvh] md:rounded-3xl",
              size === "lg" ? "md:max-w-2xl" : "md:max-w-lg",
              // Slides up when it opens (browsers without @starting-style just show it).
              "transition-transform duration-300 ease-out starting:translate-y-full md:starting:translate-y-6",
            ),
          variant === "center" &&
            "max-h-[88dvh] max-w-sm rounded-3xl transition-[transform,opacity] duration-200 ease-out starting:scale-95 starting:opacity-0",
        )}
      >
        <Content render={children} close={onClose} />
      </div>
    </div>,
    document.body,
  );
}
