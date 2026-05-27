import { describe, it, expect } from "vitest";
import { calculateMatchPoints } from "@/lib/scoring";

describe("calculateMatchPoints", () => {
  it("returns 5 for exact score match", () => {
    expect(calculateMatchPoints(2, 1, 2, 1)).toBe(5);
  });

  it("returns 5 for exact 0-0 draw", () => {
    expect(calculateMatchPoints(0, 0, 0, 0)).toBe(5);
  });

  it("returns 3 for correct goal difference (home win)", () => {
    expect(calculateMatchPoints(2, 0, 3, 1)).toBe(3);
  });

  it("returns 3 for correct goal difference (away win)", () => {
    expect(calculateMatchPoints(0, 2, 1, 3)).toBe(3);
  });

  it("returns 2 for correct winner only (home)", () => {
    expect(calculateMatchPoints(1, 0, 3, 0)).toBe(2);
  });

  it("returns 2 for correct winner only (away)", () => {
    expect(calculateMatchPoints(0, 1, 0, 3)).toBe(2);
  });

  it("returns 3 for correct draw with same goal difference", () => {
    expect(calculateMatchPoints(1, 1, 2, 2)).toBe(3);
  });

  it("returns 0 for wrong winner", () => {
    expect(calculateMatchPoints(2, 0, 0, 1)).toBe(0);
  });

  it("returns 0 for predicted draw but actual win", () => {
    expect(calculateMatchPoints(1, 1, 2, 1)).toBe(0);
  });

  it("returns 0 for predicted win but actual draw", () => {
    expect(calculateMatchPoints(2, 1, 1, 1)).toBe(0);
  });
});
