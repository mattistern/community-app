/**
 * Israeli mobile numbers, the only kind residents are whitelisted by
 * (CLAUDE.md §1: `05X-XXXXXXX`). One canonical spelling, so the whitelist, the
 * login and "my reports" can all compare phones by plain equality.
 */
export const PHONE_FORMAT_HINT = "05X-XXXXXXX";

/**
 * "0521234567", "052 123 4567", "(052) 123-4567" and "+972-52-1234567" all
 * become "052-1234567". Anything that isn't an Israeli mobile number is null.
 */
export function normalizeMobile(input: string): string | null {
  let digits = input.trim().replace(/[\s\-().]/g, "");
  if (digits.startsWith("+972")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("972")) digits = `0${digits.slice(3)}`;

  if (!/^05\d{8}$/.test(digits)) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}
