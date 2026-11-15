"use client";

import {
  formatDateFallback,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/format-time";
import { useNow } from "@/lib/use-minute-clock";

interface RelativeTimeProps {
  /** ISO timestamp. */
  iso: string;
  className?: string;
}

/**
 * "לפני 3 שעות" / "אתמול, 10:30" / ..., refreshed every minute. The server (and
 * the first client render) shows a fixed date, and the relative label appears
 * right after hydration (see lib/use-minute-clock for why).
 */
export function RelativeTime({ iso, className }: RelativeTimeProps) {
  const now = useNow();

  return (
    <time
      dateTime={iso}
      className={className}
      title={now === null ? undefined : formatDateTime(iso)}
    >
      {now === null ? formatDateFallback(iso) : formatRelativeTime(iso, now)}
    </time>
  );
}
