/**
 * A tiny localStorage-backed store for the local-first prototype, shared with
 * React through useSyncExternalStore. One implementation of the fiddly parts
 * (versioning, migration, quota errors, cross-tab sync, stable snapshots) for
 * every kind of data the prototype keeps. Nothing leaves the browser.
 */
import { useSyncExternalStore } from "react";

/** The browser's localStorage has no room left (photos are the usual cause). */
export class StorageFullError extends Error {
  constructor() {
    super("localStorage is full");
    this.name = "StorageFullError";
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  );
}

export interface PersistedStoreOptions<T> {
  key: string;
  /** Bump when the stored shape changes. Older data goes through `migrate`. */
  version: number;
  /** Fresh data for a first run, or when stored data can't be used. */
  seed: () => T;
  /**
   * Upgrades data saved by another version. `stored` is the whole saved object
   * (`{ version, data }`, or an older layout); return null to discard it and
   * start from the seed.
   */
  migrate?: (stored: unknown, fromVersion: number | undefined) => T | null;
  /** Runs each time the data is loaded (never on the server); a different result is saved. */
  onLoad?: (value: T) => T;
}

export function createPersistedStore<T>({
  key,
  version,
  seed,
  migrate,
  onLoad,
}: PersistedStoreOptions<T>) {
  let current: T;
  let loaded = false;
  const listeners = new Set<() => void>();

  function read(): { value: T; needsSave: boolean } | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { version?: number; data?: T } | null;
      if (parsed && parsed.version === version && "data" in parsed) {
        return { value: parsed.data as T, needsSave: false };
      }
      const migrated = migrate ? migrate(parsed, parsed?.version) : null;
      return migrated === null || migrated === undefined
        ? null
        : { value: migrated, needsSave: true };
    } catch {
      return null;
    }
  }

  function write(value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify({ version, data: value }));
    } catch (error) {
      throw isQuotaError(error) ? new StorageFullError() : error;
    }
  }

  function load(): T {
    const found = read();
    const base = found ? found.value : seed();
    const value = onLoad ? onLoad(base) : base;
    if (!found || found.needsSave || value !== base) {
      try {
        write(value);
      } catch {
        // Storage unavailable: the data still works, it just won't survive a reload.
      }
    }
    return value;
  }

  /** Client only. The current value, loading (and seeding) it on first use. */
  function get(): T {
    if (!loaded) {
      current = load();
      loaded = true;
    }
    return current;
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  /** Another tab changed (or cleared) the stored data: follow it. */
  function handleStorageEvent(event: StorageEvent) {
    if (event.key !== null && event.key !== key) return;
    current = load();
    loaded = true;
    notify();
  }

  function subscribe(listener: () => void) {
    if (listeners.size === 0) {
      window.addEventListener("storage", handleStorageEvent);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        window.removeEventListener("storage", handleStorageEvent);
      }
    };
  }

  /**
   * Replaces the value. With `strict`, a failed save throws and nothing
   * changes (so the person hears about it); otherwise the change is kept in
   * memory regardless.
   */
  function set(next: T, { strict = false }: { strict?: boolean } = {}): void {
    try {
      write(next);
    } catch (error) {
      if (strict) throw error;
    }
    current = next;
    loaded = true;
    notify();
  }

  /**
   * The value, or null until the browser has loaded it (and on the server).
   * Rendering a placeholder for null keeps the server HTML and the first client
   * render identical.
   */
  function useValue(): T | null {
    return useSyncExternalStore<T | null>(subscribe, get, () => null);
  }

  return { get, set, subscribe, useValue };
}
