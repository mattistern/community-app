"use client";

import { useEffect, useRef } from "react";

interface LoadMoreProps {
  /** How many are on screen now, so the observer starts over after each batch. */
  shown: number;
  total: number;
  onLoadMore: () => void;
}

/**
 * The end of the feed list. Scrolling near it loads the next batch (infinite
 * scroll); the button does the same for anyone who prefers to tap, and for
 * browsers without IntersectionObserver.
 */
export function LoadMore({ shown, total, onLoadMore }: LoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = shown < total;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || !sentinel || typeof IntersectionObserver === "undefined") return;

    // A fresh observer per batch reports again if the end is still in view,
    // so a tall screen keeps filling until the list overflows it.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, shown, onLoadMore]);

  return (
    <div ref={sentinelRef} className="pt-1 text-center">
      <p className="text-xs text-slate-500" aria-live="polite">
        מוצגים {shown} מתוך {total}
      </p>
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="mt-2 h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          טען עוד דיווחים
        </button>
      )}
    </div>
  );
}
