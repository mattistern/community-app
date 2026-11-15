/**
 * CSV export (DESIGN.md §3C): opens in Excel with Hebrew intact, escapes
 * correctly, and can't smuggle a spreadsheet formula in through a resident's text.
 */
import { describe, expect, it } from "vitest";
import {
  ISSUE_CSV_HEADERS,
  csvField,
  csvFilename,
  issueToCsvRow,
  issuesToCsv,
  neutralizeFormula,
  toCsv,
} from "@/lib/csv";
import { makeIssue } from "@/lib/test-helpers";

const BOM = "\u{FEFF}";
const photo = { type: "image" as const, thumbnailUrl: "t", fullUrl: "f", alt: "a" };

describe("neutralizeFormula (CSV injection)", () => {
  it.each(["=HYPERLINK(\"http://evil\")", "+1+1", "-2+3", "@SUM(A1)", "\tcmd", "\rcmd"])(
    "keeps %j from running as a formula",
    (value) => {
      expect(neutralizeFormula(value)).toBe(`'${value}`);
    },
  );

  it.each(["בור בכביש", "052-1234567", "2026-11-14 10:30", "4.71", "", "a=b", "שלום - עולם"])(
    "leaves ordinary text %j alone",
    (value) => {
      expect(neutralizeFormula(value)).toBe(value);
    },
  );
});

describe("csvField", () => {
  it("leaves plain text, including Hebrew, unquoted", () => {
    expect(csvField("בור בכביש")).toBe("בור בכביש");
  });

  it("quotes a field with a comma, a quote or a line break", () => {
    expect(csvField("בור, גדול")).toBe('"בור, גדול"');
    expect(csvField("שורה\nשנייה")).toBe('"שורה\nשנייה"');
    expect(csvField("שורה\r\nשנייה")).toBe('"שורה\r\nשנייה"');
  });

  it("doubles quotes inside a quoted field", () => {
    expect(csvField('אמר "שלום"')).toBe('"אמר ""שלום"""');
  });
});

describe("toCsv", () => {
  it("starts with a byte-order mark so Excel reads the Hebrew as UTF-8", () => {
    expect(toCsv([["א"]]).startsWith(BOM)).toBe(true);
  });

  it("separates rows with CRLF and ends with one", () => {
    expect(toCsv([["a", "b"], ["c", "d"]])).toBe(`${BOM}a,b\r\nc,d\r\n`);
  });

  it("escapes every field", () => {
    expect(toCsv([["x, y", 'say "hi"']])).toBe(`${BOM}"x, y","say ""hi"""\r\n`);
  });
});

describe("issueToCsvRow", () => {
  const sample = makeIssue({
    id: "101",
    title: "בור גדול בכביש",
    description: "בור עמוק",
    category: "תשתיות וכבישים",
    location: "רחוב הבנים 12",
    authorPhone: "054-7654321",
    status: "בתהליך",
    adminNote: "הועבר לקבלן",
    createdAt: "2026-11-14T08:30:00.000Z",
    ratingSum: 113,
    voteCount: 24,
    media: photo,
  });

  it("has one cell per header", () => {
    expect(issueToCsvRow(sample)).toHaveLength(ISSUE_CSV_HEADERS.length);
  });

  it("fills the cells in header order, with the local time and the urgency numbers", () => {
    expect(issueToCsvRow(sample)).toEqual([
      "101",
      "2026-11-14 10:30", // Israel time (UTC+2 in November)
      "תשתיות וכבישים",
      "בור גדול בכביש",
      "בור עמוק",
      "רחוב הבנים 12",
      "054-7654321",
      "בתהליך",
      "הועבר לקבלן",
      "4.71", // 113 / 24
      "24",
      "4.41", // (113 + 5 * 3) / (24 + 5)
      "",
      "יש",
    ]);
  });

  it("leaves out what a report doesn't have, and scores an unvoted one at the neutral 3.00", () => {
    const row = issueToCsvRow(makeIssue({ id: "7", ratingSum: 0, voteCount: 0 }));

    expect(row[2]).toBe(""); // category
    expect(row[5]).toBe(""); // location
    expect(row[8]).toBe(""); // admin note
    expect(row[9]).toBe(""); // average
    expect(row[10]).toBe("0");
    expect(row[11]).toBe("3.00");
    expect(row[13]).toBe("אין");
  });

  it("shows when a resolved report was closed, and whether its photo was deleted", () => {
    const row = issueToCsvRow(
      makeIssue({ status: "בוצע", resolvedAt: "2026-11-10T15:45:00.000Z", mediaRemovedAt: "2026-11-17T15:45:00.000Z" }),
    );

    expect(row[12]).toBe("2026-11-10 17:45");
    expect(row[13]).toBe("נמחקה");
  });

  it("keeps a resident's text from running as a formula", () => {
    const row = issueToCsvRow(
      makeIssue({ title: '=HYPERLINK("http://evil","לחצו")', description: "-cmd", location: "@home" }),
    );

    expect(row[3]).toBe(`'=HYPERLINK("http://evil","לחצו")`);
    expect(row[4]).toBe("'-cmd");
    expect(row[5]).toBe("'@home");
  });
});

describe("issuesToCsv", () => {
  it("is the header row followed by one row per report", () => {
    const csv = issuesToCsv([makeIssue({ id: "1" }), makeIssue({ id: "2" })]);

    const lines = csv.slice(BOM.length).split("\r\n");
    expect(lines[0]).toBe(ISSUE_CSV_HEADERS.join(","));
    expect(lines).toHaveLength(4); // header, two reports, and the empty piece after the final CRLF
    expect(lines[1].startsWith("1,")).toBe(true);
    expect(lines[2].startsWith("2,")).toBe(true);
  });

  it("quotes a description with commas and line breaks", () => {
    const csv = issuesToCsv([makeIssue({ description: "אחת, שתיים\nשלוש" })]);

    expect(csv).toContain('"אחת, שתיים\nשלוש"');
  });

  it("is just the header for no reports", () => {
    expect(issuesToCsv([])).toBe(`${BOM}${ISSUE_CSV_HEADERS.join(",")}\r\n`);
  });
});

describe("csvFilename", () => {
  it("names the file after the day", () => {
    expect(csvFilename(Date.parse("2026-11-15T09:00:00.000Z"))).toBe("reports-2026-11-15.csv");
  });
});
