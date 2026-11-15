/**
 * "Now", for components that show countdowns or time-relative numbers. One
 * shared clock for the whole page (a single timer, not one per component),
 * ticking every minute. Nothing reads the current time while rendering: Cache
 * Components forbids it during prerendering, and the HTML has to match what the
 * client renders first. So the value is null on the server and in the first
 * client render, and the real minute arrives right after hydration.
 */
import { useSyncExternalStore } from "react";

export const MINUTE_MS = 60_000;

const listeners = new Set<() => void>();
let currentMinute: number | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

const readMinute = () => Math.floor(Date.now() / MINUTE_MS);

/** Wakes just after the next minute starts, so the clock changes when the real minute does and is never more than a minute behind. */
function scheduleTick() {
  timer = setTimeout(() => {
    currentMinute = readMinute();
    listeners.forEach((listener) => listener());
    scheduleTick();
  }, MINUTE_MS - (Date.now() % MINUTE_MS) + 50);
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (listeners.size === 1) scheduleTick();
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      clearTimeout(timer);
      timer = undefined;
      currentMinute = undefined; // re-read fresh on the next mount
    }
  };
}

function getSnapshot(): number | null {
  currentMinute ??= readMinute();
  return currentMinute;
}

function getServerSnapshot(): number | null {
  return null;
}

/** The current minute (whole minutes since the epoch), or null until the browser knows it. */
export function useMinuteClock(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The current time in ms, to the minute, or null until the browser knows it. */
export function useNow(): number | null {
  const minute = useMinuteClock();
  return minute === null ? null : minute * MINUTE_MS;
}
