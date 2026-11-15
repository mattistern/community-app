"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import type { IssueMedia } from "@/lib/types";

/**
 * The issue's photo. Starts as the low-res thumbnail; the full-resolution file
 * is loaded only when the resident taps it (CLAUDE.md §2).
 */
export function IssuePhoto({ media }: { media: IssueMedia }) {
  const [full, setFull] = useState(false);

  if (full) {
    return (
      <div className="overflow-hidden rounded-xl bg-slate-100">
        <Image
          src={media.fullUrl}
          alt={media.alt}
          width={1600}
          height={900}
          unoptimized
          className="h-auto w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setFull(true)}
      aria-label="הצג את התמונה באיכות מלאה"
      className="relative block w-full overflow-hidden rounded-xl bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <Image
        src={media.thumbnailUrl}
        alt={media.alt}
        width={800}
        height={450}
        sizes="(min-width: 448px) 416px, 100vw"
        className="aspect-video w-full object-cover"
      />
      <span className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-md bg-slate-900/70 px-2 py-1 text-xs font-medium text-white">
        <Maximize2 aria-hidden className="size-3.5" />
        הקש להגדלה
      </span>
    </button>
  );
}
