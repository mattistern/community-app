/**
 * "Add to home screen" support. Chrome and Edge on Android announce that the app
 * is installable with a `beforeinstallprompt` event, fired once and early, so it
 * is caught here as soon as the page starts and kept until a button asks for it.
 * iOS Safari has no such event: there the person has to use the share sheet, so
 * the screen shows instructions instead. Client only.
 */
import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState =
  /** Already installed, or this browser can't install the app: show nothing. */
  | "hidden"
  /** The browser can show its own install dialog. */
  | "prompt"
  /** iOS: explain the share-sheet steps. */
  | "ios";

let deferred: BeforeInstallPromptEvent | null = null;
let started = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Starts listening; safe to call more than once. */
export function startPwaInstall(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // keep it for our own button instead of the browser's mini-bar
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const { userAgent, platform, maxTouchPoints } = navigator;
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    // iPadOS reports itself as a Mac.
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}

function getSnapshot(): InstallState {
  if (isStandalone()) return "hidden";
  if (deferred) return "prompt";
  return isIos() ? "ios" : "hidden";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getSnapshot, () => "hidden");
}

/** Shows the browser's install dialog. Resolves to whether the person accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  deferred = null; // the event can be used only once
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
}
