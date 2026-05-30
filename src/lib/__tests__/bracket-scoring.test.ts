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

  it("returns zero score points when no teams match in R16+", () => {
    const result = calculateBracketMatchScore("R16", 1, 2, 3, 4, 1, 0, 1, 0, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 0, scorePoints: 0 });
  });

  it("awards score points for correct goal diff when both teams match", () => {
    const result = calculateBracketMatchScore("QF", 1, 2, 1, 2, 3, 1, 4, 2, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 8, scorePoints: 3 });
  });

  // Partial credit: only one predicted team matches. Anchor on it, reorient the
  // scoreline from its side, grade 5/3/2/0, then halve (rounded down).
  it("halves an exact scoreline (5 -> 2) when only one team matches", () => {
    // Predicted team 1 beats opp 2-0; actual: team 1 (home) wins 2-0 vs a different team 3.
    const result = calculateBracketMatchScore("R16", 1, 2, 1, 3, 2, 0, 2, 0, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 2, scorePoints: 2 });
  });

  it("halves a correct margin (3 -> 1) when only one team matches", () => {
    // Anchor team 1: predicted +1 margin (2-1), actual +1 margin (3-2) vs different opp.
    const result = calculateBracketMatchScore("R16", 1, 2, 1, 3, 2, 1, 3, 2, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 2, scorePoints: 1 });
  });

  it("halves a correct winner (2 -> 1) when only one team matches", () => {
    // Anchor team 1: predicted win (2-0), actual win (2-1) vs different opp -> 2, halved to 1.
    const result = calculateBracketMatchScore("R16", 1, 2, 1, 3, 2, 0, 2, 1, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 2, scorePoints: 1 });
  });

  it("gives zero score points when the matched team's outcome is wrong", () => {
    // Anchor team 1: predicted win (2-0), but team 1 actually lost 0-2 vs different opp.
    const result = calculateBracketMatchScore("R16", 1, 2, 1, 3, 2, 0, 0, 2, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 2, scorePoints: 0 });
  });

  it("anchors by team identity, scoring full points when both teams match in swapped slots", () => {
    // Predicted 1(home) 2-1 over 2(away); actual has them swapped: 2(home) 1-2 to 1(away).
    // Oriented by team 1: predicted 2-1, actual 2-1 -> exact 5, both teams matched -> full.
    const result = calculateBracketMatchScore("R16", 1, 2, 2, 1, 2, 1, 1, 2, DEFAULT_CONFIG);
    expect(result).toEqual({ teamPoints: 4, scorePoints: 5 });
  });
});
