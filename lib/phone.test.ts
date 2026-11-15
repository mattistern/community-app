/** Israeli mobile numbers: one canonical spelling, `05X-XXXXXXX` (CLAUDE.md §1). */
import { describe, expect, it } from "vitest";
import { PHONE_FORMAT_HINT, normalizeMobile } from "@/lib/phone";

describe("normalizeMobile", () => {
  it.each([
    ["052-1234567"],
    ["0521234567"],
    ["052 123 4567"],
    ["052 1234567"],
    ["(052) 123-4567"],
    ["052.123.4567"],
    ["  052-1234567  "],
    ["+972-52-1234567"],
    ["+972521234567"],
    ["972521234567"],
  ])("reads %s as 052-1234567", (input) => {
    expect(normalizeMobile(input)).toBe("052-1234567");
  });

  it.each([
    ["050-0000000", "050-0000000"],
    ["0541234567", "054-1234567"],
    ["058-4455667", "058-4455667"],
  ])("keeps the prefix of %s", (input, expected) => {
    expect(normalizeMobile(input)).toBe(expected);
  });

  it.each([
    [""],
    ["   "],
    ["123"],
    ["abc"],
    ["052-123456"], // one digit short
    ["052-12345678"], // one digit too many
    ["062-1234567"], // not a 05X prefix
    ["04-1234567"], // a landline
    ["+972-2-1234567"], // a Jerusalem landline
    ["052-1234567x"],
    ["+1 555 123 4567"], // another country
  ])("refuses %j", (input) => {
    expect(normalizeMobile(input)).toBeNull();
  });

  it("names the format residents are asked for", () => {
    expect(PHONE_FORMAT_HINT).toBe("05X-XXXXXXX");
  });
});
