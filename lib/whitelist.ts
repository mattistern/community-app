/**
 * Rules for the admin-managed whitelist of phone numbers that may sign in
 * (CLAUDE.md §1). Pure functions; lib/local-whitelist keeps the data.
 */
import { PHONE_FORMAT_HINT, normalizeMobile } from "./phone";

export type WhitelistRole = "admin" | "resident";

export interface WhitelistEntry {
  /** Canonical `05X-XXXXXXX`. */
  phone: string;
  role: WhitelistRole;
  /** ISO timestamp. */
  addedAt: string;
}

export type AddResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

/** Checks a number an admin typed in: it must be a valid mobile number, not already listed. */
export function validateWhitelistAdd(
  entries: readonly WhitelistEntry[],
  input: string,
): AddResult {
  const phone = normalizeMobile(input);
  if (phone === null) {
    return {
      ok: false,
      error: `מספר הטלפון אינו תקין. יש להזין מספר נייד בפורמט ${PHONE_FORMAT_HINT}`,
    };
  }
  if (entries.some((entry) => entry.phone === phone)) {
    return { ok: false, error: "המספר כבר ברשימת המורשים" };
  }
  return { ok: true, phone };
}

/** Only residents can be removed; admin numbers are set in the system's settings, not here. */
export function canRemove(entry: WhitelistEntry): boolean {
  return entry.role === "resident";
}

export function removeEntry(
  entries: readonly WhitelistEntry[],
  phone: string,
): WhitelistEntry[] {
  return entries.filter((entry) => entry.phone !== phone || !canRemove(entry));
}
