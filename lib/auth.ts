/**
 * Sign-in rules (CLAUDE.md §1). Pure functions. The one-time code is a mock for
 * now: a master code, structured so a real SMS/WhatsApp sender can replace
 * `isValidOtp` later without touching the screens.
 */
import { PHONE_FORMAT_HINT, normalizeMobile } from "./phone";
import type { WhitelistEntry, WhitelistRole } from "./whitelist";

/** Mock one-time code, accepted for every number until real SMS exists. */
export const DEV_MASTER_OTP = "1234";
export const OTP_LENGTH = DEV_MASTER_OTP.length;

export type PhoneCheck =
  | { ok: true; phone: string; role: WhitelistRole }
  | { ok: false; error: string };

/** The number must be a valid mobile number on the admin-approved list. */
export function checkPhone(
  entries: readonly WhitelistEntry[],
  input: string,
): PhoneCheck {
  const phone = normalizeMobile(input);
  if (phone === null) {
    return {
      ok: false,
      error: `מספר הטלפון אינו תקין. יש להזין מספר נייד בפורמט ${PHONE_FORMAT_HINT}`,
    };
  }
  const entry = entries.find((e) => e.phone === phone);
  if (!entry) {
    return {
      ok: false,
      error: "המספר הזה לא מופיע ברשימת המורשים. יש לפנות להנהלת הקהילה.",
    };
  }
  return { ok: true, phone, role: entry.role };
}

export function isValidOtp(code: string): boolean {
  return code.trim() === DEV_MASTER_OTP;
}
