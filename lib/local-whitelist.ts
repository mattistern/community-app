/**
 * The admin-managed whitelist, kept in this browser's localStorage like the
 * rest of the prototype's data. There is no sign-in yet, so nothing consults it
 * for now; it is here so the admin screen is real and the login can use it later.
 */
import { createSeedWhitelist } from "./mock-issues";
import { createPersistedStore } from "./persisted-store";
import {
  removeEntry,
  validateWhitelistAdd,
  type AddResult,
  type WhitelistEntry,
} from "./whitelist";

const store = createPersistedStore<WhitelistEntry[]>({
  key: "community-app:whitelist",
  version: 1,
  seed: () => createSeedWhitelist(Date.now()),
});

/** The entries, or null until the browser has loaded them (and on the server). */
export const useWhitelist = store.useValue;

/** Client only. */
export const getWhitelist = store.get;

/** Adds a resident's number. The result says why it was refused (invalid or already listed). */
export function addToWhitelist(
  input: string,
  now: number = Date.now(),
): AddResult {
  const entries = getWhitelist();
  const result = validateWhitelistAdd(entries, input);
  if (result.ok) {
    store.set([
      ...entries,
      {
        phone: result.phone,
        role: "resident",
        addedAt: new Date(now).toISOString(),
      },
    ]);
  }
  return result;
}

/** Removes a resident's access; admin numbers can't be removed from here. */
export function removeFromWhitelist(phone: string): void {
  store.set(removeEntry(getWhitelist(), phone));
}

/** Demo: back to the starting list. */
export function resetWhitelist(now: number = Date.now()): void {
  store.set(createSeedWhitelist(now));
}
