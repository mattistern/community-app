"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";

type ShareState = "idle" | "copied" | "failed";

const LABELS: Record<ShareState, string> = {
  idle: "שתף קישור",
  copied: "הקישור הועתק",
  failed: "לא ניתן להעתיק",
};

const FEEDBACK_MS = 2000;

interface ShareButtonProps {
  issueId: string;
  title: string;
}

/**
 * Shares the issue's deep link (/issue/[id]). Uses the native share sheet when
 * the browser has one (WhatsApp is the main target on mobile), otherwise
 * copies the link to the clipboard.
 */
export function ShareButton({ issueId, title }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [state]);

  async function handleShare() {
    const url = new URL(`/issue/${issueId}`, window.location.origin).toString();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (error) {
        // Dismissing the share sheet is not an error.
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Any other failure falls back to copying the link.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {state === "copied" ? (
        <Check aria-hidden className="size-4 text-emerald-600" />
      ) : (
        <Share2 aria-hidden className="size-4" />
      )}
      <span aria-live="polite">{LABELS[state]}</span>
    </button>
  );
}
