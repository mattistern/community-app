/**
 * Hebrew time labels for issue cards.
 *
 * Everything is computed in one fixed community time zone so the output never
 * depends on where the code runs. Nothing here reads the current time; callers
 * pass `nowMs` in (see RelativeTime), which keeps these functions pure and
 * compatible with Cache Components.
 */
export const COMMUNITY_TIME_ZONE = "Asia/Jerusalem";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: COMMUNITY_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function localParts(ms: number): LocalParts {
  const parts: LocalParts = { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
  for (const { type, value } of partsFormatter.formatToParts(new Date(ms))) {
    if (
      type === "year" ||
      type === "month" ||
      type === "day" ||
      type === "hour" ||
      type === "minute"
    ) {
      parts[type] = Number(value);
    }
  }
  parts.hour %= 24;
  return parts;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const calendarDay = (p: LocalParts) => Date.UTC(p.year, p.month - 1, p.day) / DAY_MS;
const formatDate = (p: LocalParts) => `${p.day}.${p.month}.${p.year}`;
const formatClock = (p: LocalParts) => `${pad2(p.hour)}:${pad2(p.minute)}`;

/** "לפני 3 שעות", "אתמול, 10:30", "לפני יומיים", ... Dates 30+ days old show as d.M.yyyy. */
export function formatRelativeTime(iso: string, nowMs: number): string {
  const thenMs = Date.parse(iso);
  const elapsed = nowMs - thenMs;

  // Also covers small clock skew where the post appears to be from the future.
  if (elapsed < MINUTE_MS) return "עכשיו";

  if (elapsed < HOUR_MS) {
    const minutes = Math.floor(elapsed / MINUTE_MS);
    return minutes === 1 ? "לפני דקה" : `לפני ${minutes} דקות`;
  }

  if (elapsed < DAY_MS) {
    const hours = Math.floor(elapsed / HOUR_MS);
    if (hours === 1) return "לפני שעה";
    if (hours === 2) return "לפני שעתיים";
    return `לפני ${hours} שעות`;
  }

  const then = localParts(thenMs);
  const days = calendarDay(localParts(nowMs)) - calendarDay(then);

  if (days <= 1) return `אתמול, ${formatClock(then)}`;
  if (days === 2) return "לפני יומיים";
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 14) return "לפני שבוע";
  if (days < 21) return "לפני שבועיים";
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
  return formatDate(then);
}

/**
 * Time left on a countdown, in Hebrew, rounded up: a fresh 7-day countdown reads
 * "7 ימים" and never shows a number that has already been used up. "5 ימים",
 * "יומיים", "10 שעות", "שעתיים", "פחות משעה".
 */
export function formatRemaining(ms: number): string {
  if (ms > 2 * DAY_MS) return `${Math.ceil(ms / DAY_MS)} ימים`;
  if (ms > DAY_MS) return "יומיים";
  if (ms > 2 * HOUR_MS) return `${Math.ceil(ms / HOUR_MS)} שעות`;
  if (ms > HOUR_MS) return "שעתיים";
  return "פחות משעה";
}

/** Sortable local date and time for spreadsheets, e.g. "2026-11-14 10:30". */
export function formatSortableDateTime(iso: string): string {
  const parts = localParts(Date.parse(iso));
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)} ${formatClock(parts)}`;
}

/** Full local date and time, e.g. "14.11.2026, 10:30" (tooltip text). */
export function formatDateTime(iso: string): string {
  const parts = localParts(Date.parse(iso));
  return `${formatDate(parts)}, ${formatClock(parts)}`;
}

/**
 * Date-only label used for server rendering, before the client knows the time.
 * Deliberately avoids Intl so server and browser always produce identical text
 * (a mismatch would be a hydration error).
 */
export function formatDateFallback(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return `${day}.${month}.${year}`;
}
