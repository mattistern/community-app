"use client";

import { useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { DialogSheet } from "@/components/ui/dialog-sheet";
import { promptInstall, useInstallState } from "@/lib/pwa-install";

const iconButton =
  "grid size-11 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

function IosInstructions({ onClose }: { onClose: () => void }) {
  return (
    <DialogSheet labelledBy="ios-install-title" onClose={onClose}>
      {({ close }) => (
        <>
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 py-2 ps-4 pe-2">
            <h2 id="ios-install-title" className="text-lg font-extrabold tracking-tight text-slate-900">
              הוסף למסך הבית
            </h2>
            <button type="button" onClick={close} aria-label="סגור" className={iconButton}>
              <X aria-hidden className="size-5" />
            </button>
          </header>
          <div className="space-y-4 px-4 py-5">
            <p className="text-sm leading-relaxed text-slate-600">
              כך מתקינים את קול הקהילה כמו אפליקציה, בלי חנות אפליקציות:
            </p>
            <ol className="space-y-3 text-sm text-slate-800">
              <li className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
                  <Share aria-hidden className="size-4" />
                </span>
                <span className="pt-1">
                  ב-Safari, לחצו על כפתור השיתוף <strong>בתחתית המסך</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
                  <SquarePlus aria-hidden className="size-4" />
                </span>
                <span className="pt-1">
                  גללו ובחרו <strong>״הוסף למסך הבית״</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                  3
                </span>
                <span className="pt-1">
                  לחצו <strong>״הוסף״</strong>. האייקון יופיע במסך הבית.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={close}
              className="h-12 w-full rounded-xl bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              הבנתי
            </button>
          </div>
        </>
      )}
    </DialogSheet>
  );
}

/**
 * "הוסף למסך הבית" in the header. Shown only when the app can be installed and
 * isn't already: the browser's own dialog where it offers one (Android Chrome and
 * Edge), step-by-step instructions on iOS, nothing anywhere else.
 */
export function InstallButton() {
  const state = useInstallState();
  const [showIos, setShowIos] = useState(false);

  if (state === "hidden") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (state === "prompt" ? void promptInstall() : setShowIos(true))}
        aria-label="הוסף למסך הבית"
        title="הוסף למסך הבית"
        className={iconButton}
      >
        <Download aria-hidden className="size-5" />
      </button>
      {showIos && <IosInstructions onClose={() => setShowIos(false)} />}
    </>
  );
}
