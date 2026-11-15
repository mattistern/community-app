/** The sizing math behind the local photo compression (CLAUDE.md §2, media optimization). */
import { describe, expect, it } from "vitest";
import { fitWithin, formatBytes } from "@/lib/image-processing";

describe("fitWithin", () => {
  it("leaves an image that already fits alone (never scales up)", () => {
    expect(fitWithin(400, 300, 1280)).toEqual({ width: 400, height: 300 });
    expect(fitWithin(1280, 720, 1280)).toEqual({ width: 1280, height: 720 });
  });

  it("scales a landscape photo so its width is the max edge", () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
  });

  it("scales a portrait photo so its height is the max edge", () => {
    expect(fitWithin(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
  });

  it("keeps the aspect ratio within a pixel of rounding", () => {
    const { width, height } = fitWithin(4032, 3024, 480);
    expect(Math.max(width, height)).toBe(480);
    expect(Math.abs(width / height - 4032 / 3024)).toBeLessThan(0.01);
  });

  it("never collapses a very thin image to zero pixels", () => {
    expect(fitWithin(10_000, 1, 480)).toEqual({ width: 480, height: 1 });
  });
});

describe("formatBytes", () => {
  it.each([
    [140 * 1024, "140KB"],
    [1, "1KB"],
    [1024 * 1024, "1.0MB"],
    [4.2 * 1024 * 1024, "4.2MB"],
  ])("%d bytes -> %s", (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});
