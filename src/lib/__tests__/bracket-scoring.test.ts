import { describe, it, expect } from "vitest";
import {
  calculateBracketTeamPoints,
  calculateBracketMatchScore,
} from "../scoring";

const DEFAULT_CONFIG = {
  team_points_r16: 2,
  team_points_qf: 4,
  team_points_sf: 6,
  team_points_third: 6,
  team_points_final: 8,
};

describe("calculateBracketTeamPoints", () => {
  it("returns 0 for R32 (teams are given)", () => {
    expect(calculateBracketTeamPoints("R32", 1, 2, 1, 2, DEFAULT_CONFIG)).toBe(0);
  });

  it("awards points per correct team in R16", () => {
    expect(calculateBracketTeamPoints("R16", 1, 2, 1, 2, DEFAULT_CONFIG)).toBe(4);
    expect(calculateBracketTeamPoints("R16", 1, 2, 1, 3, DEFAULT_CONFIG)).toBe(2);
    expect(calculateBracketTeamPoints("R16", 1, 2, 3, 4, DEFAULT_CONFIG)).toBe(0);
  });

  it("handles swapped home/away positions", () => {
    expect(calculateBracketTeamPoints("R16", 1, 2, 2, 1, DEFAULT_CONFIG)).toBe(4);
  });

  it("uses correct points per stage", () => {
    expect(calculateBracketTeamPoints("QF", 1, 2, 1, 2, DEFAULT_CONFIG)).toBe(8);
    expect(calculateBracketTeamPoints("SF", 1, 2, 1, 2, DEFAULT_CONFIG)).toBe(12);
    expect(calculateBracketTeamPoints("final", 1, 2, 1, 2, DEFAULT_CONFIG)).toBe(16);
  });

  it("uses third_place points for third_place stage", () => {
    expect(calculateBracketTeamPoints("third_place", 1, 2, 1, 2, DEFAULT_CONFIG)).toBe(12);
  });
});

describe("calculateBracketMatchScore", () => {
  it("scores R32 with standard match points (teams always match)", () => {
    const result = calculateBracketMatchScore("R32", 1, 2, 1, 2, 2, 1, 2, 1, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 0, scorePoints: 5 });
  });

  it("scores R32 correct goal diff", () => {
    const result = calculateBracketMatchScore("R32", 1, 2, 1, 2, 2, 0, 3, 1, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 0, scorePoints: 3 });
  });

  it("scores R16+ with team points and score points when both teams match", () => {
    const result = calculateBracketMatchScore("R16", 1, 2, 1, 2, 3, 1, 3, 1, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 4, scorePoints: 5 });
  });

  it("scores R16+ with team points only when teams partially match", () => {
    const result = calculateBracketMatchScore("R16", 1, 2, 1, 3, 2, 0, 2, 0, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 2, scorePoints: 0 });
  });

  it("returns zero score points when no teams match in R16+", () => {
    const result = calculateBracketMatchScore("R16", 1, 2, 3, 4, 1, 0, 1, 0, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 0, scorePoints: 0 });
  });

  it("awards score points for correct goal diff when both teams match", () => {
    const result = calculateBracketMatchScore("QF", 1, 2, 1, 2, 3, 1, 4, 2, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 8, scorePoints: 3 });
  });
});
