/**
 * The signed-in person, kept in localStorage plus a 365-day cookie that is
 * pushed forward on every visit (CLAUDE.md §1: no repeated logins). Prototype
 * only: the cookie is not read by any server yet.
 */
import { createPersistedStore } from "./persisted-store";
import type { WhitelistRole } from "./whitelist";

export interface Session {
  phone: string;
  role: WhitelistRole;
}

interface SessionState {
  session: Session | null;
}

const COOKIE_NAME = "community-session";
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

const store = createPersistedStore<SessionState>({
  key: "community-app:session",
  version: 1,
  seed: () => ({ session: null }),
});

/** The state, or null until the browser has loaded it (and on the server). */
export const useSessionState = store.useValue;

/** Client only. Who is signed in, or null. Data-layer checks use this, not what a component passes. */
export function getSession(): Session | null {
  return store.get().session;
}

/** Client only. Extends the cookie to 365 days from now. */
export function refreshSessionCookie(): void {
  const { session } = store.get();
  if (!session) return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(session.phone)}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; samesite=lax`;
}

export function signIn(session: Session): void {
  store.set({ session });
  refreshSessionCookie();
}

export function signOut(): void {
  store.set({ session: null });
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
}
