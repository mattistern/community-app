/** The admin-managed whitelist: what can be added, and what can be removed (CLAUDE.md §1). */
import { describe, expect, it } from "vitest";
import {
  canRemove,
  removeEntry,
  validateWhitelistAdd,
  type WhitelistEntry,
} from "@/lib/whitelist";

const entry = (phone: string, role: WhitelistEntry["role"] = "resident"): WhitelistEntry => ({
  phone,
  role,
  addedAt: "2026-11-01T08:00:00.000Z",
});

const ENTRIES = [entry("050-0000000", "admin"), entry("052-1234567"), entry("054-7654321")];

describe("validateWhitelistAdd", () => {
  it("accepts a new valid number and returns it in the canonical spelling", () => {
    expect(validateWhitelistAdd(ENTRIES, "053 999 8877")).toEqual({ ok: true, phone: "053-9998877" });
    expect(validateWhitelistAdd(ENTRIES, "+972-53-9998877")).toEqual({ ok: true, phone: "053-9998877" });
  });

  it("refuses a number that isn't an Israeli mobile, saying which format to use", () => {
    for (const input of ["", "123", "04-1234567", "052-123"]) {
      const result = validateWhitelistAdd(ENTRIES, input);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error).toContain("05X-XXXXXXX");
    }
  });

  it("refuses a number that is already listed, however it is typed", () => {
    for (const input of ["052-1234567", "0521234567", "052 123 4567", "+972521234567"]) {
      expect(validateWhitelistAdd(ENTRIES, input)).toEqual({
        ok: false,
        error: "המספר כבר ברשימת המורשים",
      });
    }
  });

  it("also refuses an admin's number as a duplicate", () => {
    expect(validateWhitelistAdd(ENTRIES, "0500000000").ok).toBe(false);
  });
});

describe("removing access", () => {
  it("only residents can be removed", () => {
    expect(canRemove(entry("052-1234567"))).toBe(true);
    expect(canRemove(entry("050-0000000", "admin"))).toBe(false);
  });

  it("removes a resident and leaves the rest", () => {
    expect(removeEntry(ENTRIES, "052-1234567").map((e) => e.phone)).toEqual(["050-0000000", "054-7654321"]);
  });

  it("never removes an admin's number", () => {
    expect(removeEntry(ENTRIES, "050-0000000")).toEqual(ENTRIES);
  });

  it("does nothing for a number that isn't listed", () => {
    expect(removeEntry(ENTRIES, "058-0000001")).toEqual(ENTRIES);
  });
});
