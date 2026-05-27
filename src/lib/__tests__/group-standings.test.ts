import { describe, it, expect } from "vitest";
import {
  computeGroupStandings,
  resolveGroupCode,
  type GroupStageResult,
  type Standing,
} from "../group-standings";

const A = 101;
const B = 102;
const C = 103;
const D = 104;

function r(
  home: number,
  away: number,
  hs: number,
  as_: number
): GroupStageResult {
  return {
    match_id: Math.floor(Math.random() * 1e9),
    group_id: 1,
    home_team_id: home,
    away_team_id: away,
    home_score: hs,
    away_score: as_,
  };
}

describe("computeGroupStandings", () => {
  it("orders teams by points (3-1-0 records)", () => {
    // A beats B, A beats C, A beats D → 9 pts
    // B beats C, B beats D → 6 pts
    // C beats D → 3 pts
    // D loses all → 0 pts
    const results = [
      r(A, B, 1, 0),
      r(A, C, 1, 0),
      r(A, D, 1, 0),
      r(B, C, 1, 0),
      r(B, D, 1, 0),
      r(C, D, 1, 0),
    ];
    const standings = computeGroupStandings([A, B, C, D], results);
    expect(standings.map((s) => s.team_id)).toEqual([A, B, C, D]);
    expect(standings[0].pts).toBe(9);
    expect(standings[3].pts).toBe(0);
  });

  it("breaks point ties by goal difference", () => {
    // A and B both finish with 6 pts (2W 1L), A has much better GD
    const results = [
      r(A, C, 5, 0),
      r(A, D, 5, 0),
      r(B, A, 1, 0),
      r(B, C, 1, 0),
      r(D, B, 1, 0),
      r(C, D, 1, 0),
    ];
    const standings = computeGroupStandings([A, B, C, D], results);
    expect(standings[0].team_id).toBe(A);
    expect(standings[1].team_id).toBe(B);
    expect(standings[0].pts).toBe(standings[1].pts);
    expect(standings[0].gd).toBeGreaterThan(standings[1].gd);
  });

  it("yields fully tied 1st/2nd when pts, GD and GF all match", () => {
    // A and B: 2W 1D 0L, same scores against C and D
    const results = [
      r(A, B, 1, 1),
      r(A, C, 2, 0),
      r(A, D, 2, 0),
      r(B, C, 2, 0),
      r(B, D, 2, 0),
      r(C, D, 0, 0),
    ];
    const standings = computeGroupStandings([A, B, C, D], results);
    expect(standings[0].pts).toBe(standings[1].pts);
    expect(standings[0].gd).toBe(standings[1].gd);
    expect(standings[0].gf).toBe(standings[1].gf);
    expect([A, B]).toContain(standings[0].team_id);
    expect([A, B]).toContain(standings[1].team_id);
  });
});

function buildStandingsMap(): Map<string, Standing[]> {
  // Synthetic standings for groups A and B
  const groupA: Standing[] = [
    { team_id: A, played: 3, pts: 9, gd: 5, gf: 7, ga: 2 },
    { team_id: B, played: 3, pts: 6, gd: 2, gf: 4, ga: 2 },
    { team_id: C, played: 3, pts: 3, gd: -3, gf: 1, ga: 4 },
    { team_id: D, played: 3, pts: 0, gd: -4, gf: 0, ga: 4 },
  ];
  return new Map([["A", groupA]]);
}

describe("resolveGroupCode", () => {
  it("resolves '1A' to the group winner", () => {
    expect(resolveGroupCode("1A", buildStandingsMap())).toBe(A);
  });

  it("resolves '2A' to the runner-up", () => {
    expect(resolveGroupCode("2A", buildStandingsMap())).toBe(B);
  });

  it("returns null for third-placed codes", () => {
    expect(resolveGroupCode("3ABCDF", buildStandingsMap())).toBeNull();
    expect(resolveGroupCode("3CDFGH", buildStandingsMap())).toBeNull();
  });

  it("returns null for winner/loser bracket codes", () => {
    expect(resolveGroupCode("W74", buildStandingsMap())).toBeNull();
    expect(resolveGroupCode("L101", buildStandingsMap())).toBeNull();
  });

  it("returns null when the group's standings are missing", () => {
    expect(resolveGroupCode("1Z", buildStandingsMap())).toBeNull();
  });

  it("returns null when 1st and 2nd are tied on pts, GD and GF", () => {
    const standings: Standing[] = [
      { team_id: A, played: 3, pts: 6, gd: 2, gf: 4, ga: 2 },
      { team_id: B, played: 3, pts: 6, gd: 2, gf: 4, ga: 2 },
      { team_id: C, played: 3, pts: 3, gd: -2, gf: 1, ga: 3 },
      { team_id: D, played: 3, pts: 0, gd: -2, gf: 0, ga: 2 },
    ];
    const map = new Map([["A", standings]]);
    expect(resolveGroupCode("1A", map)).toBeNull();
    expect(resolveGroupCode("2A", map)).toBeNull();
  });

  it("returns null for '2A' when 2nd and 3rd are tied (cannot distinguish)", () => {
    const standings: Standing[] = [
      { team_id: A, played: 3, pts: 9, gd: 5, gf: 7, ga: 2 },
      { team_id: B, played: 3, pts: 3, gd: 0, gf: 2, ga: 2 },
      { team_id: C, played: 3, pts: 3, gd: 0, gf: 2, ga: 2 },
      { team_id: D, played: 3, pts: 0, gd: -5, gf: 0, ga: 5 },
    ];
    const map = new Map([["A", standings]]);
    expect(resolveGroupCode("1A", map)).toBe(A);
    expect(resolveGroupCode("2A", map)).toBeNull();
  });
});