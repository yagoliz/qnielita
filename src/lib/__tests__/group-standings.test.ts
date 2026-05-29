import { describe, it, expect } from "vitest";
import {
  computeGroupStandings,
  resolveGroupCode,
  buildPredictedStandings,
  type GroupStageResult,
  type Standing,
  type GroupMatchInput,
  type PredictionScore,
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

describe("buildPredictedStandings", () => {
  const teams = {
    [A]: { id: A, name: "Team A", code: "AAA" },
    [B]: { id: B, name: "Team B", code: "BBB" },
    [C]: { id: C, name: "Team C", code: "CCC" },
    [D]: { id: D, name: "Team D", code: "DDD" },
  } as const;

  // All 6 group matches for a single group (group_id 1, name "A")
  function groupMatches(): GroupMatchInput[] {
    const pairs: [number, number][] = [
      [A, B],
      [C, D],
      [A, C],
      [B, D],
      [A, D],
      [B, C],
    ];
    return pairs.map(([h, a], i) => ({
      id: i + 1,
      stage: "group",
      group_id: 1,
      group_name: "A",
      home_team: teams[h as keyof typeof teams],
      away_team: teams[a as keyof typeof teams],
    }));
  }

  function pred(match_id: number, hs: number, as_: number): PredictionScore {
    return { match_id, home_score: hs, away_score: as_ };
  }

  it("builds a complete ordered table from a full set of predictions", () => {
    // A wins all, B beats C and D, C beats D, D loses all
    const ms = groupMatches();
    const preds: PredictionScore[] = [
      pred(1, 1, 0), // A beats B
      pred(2, 1, 0), // C beats D
      pred(3, 1, 0), // A beats C
      pred(4, 1, 0), // B beats D
      pred(5, 1, 0), // A beats D
      pred(6, 1, 0), // B beats C
    ];
    const groups = buildPredictedStandings(ms, preds);
    expect(groups).toHaveLength(1);
    const g = groups[0];
    expect(g.groupId).toBe(1);
    expect(g.groupName).toBe("A");
    expect(g.predictedCount).toBe(6);
    expect(g.totalCount).toBe(6);
    expect(g.standings.map((s) => s.team_id)).toEqual([A, B, C, D]);
    expect(g.teamsById[A].code).toBe("AAA");
  });

  it("reflects only predicted matches in a partial table", () => {
    const ms = groupMatches();
    const preds: PredictionScore[] = [pred(1, 2, 0)]; // only A beats B predicted
    const groups = buildPredictedStandings(ms, preds);
    const g = groups[0];
    expect(g.predictedCount).toBe(1);
    expect(g.totalCount).toBe(6);
    const a = g.standings.find((s) => s.team_id === A)!;
    const b = g.standings.find((s) => s.team_id === B)!;
    const c = g.standings.find((s) => s.team_id === C)!;
    expect(a.played).toBe(1);
    expect(a.pts).toBe(3);
    expect(b.played).toBe(1);
    expect(c.played).toBe(0);
    expect(g.standings[0].team_id).toBe(A);
  });

  it("returns all teams with zero played when no predictions exist", () => {
    const ms = groupMatches();
    const groups = buildPredictedStandings(ms, []);
    const g = groups[0];
    expect(g.predictedCount).toBe(0);
    expect(g.totalCount).toBe(6);
    expect(g.standings).toHaveLength(4);
    expect(g.standings.every((s) => s.played === 0 && s.pts === 0)).toBe(true);
  });

  it("ignores non-group matches and sorts groups by name", () => {
    const teamE = { id: 201, name: "Team E", code: "EEE" };
    const teamF = { id: 202, name: "Team F", code: "FFF" };
    const ms: GroupMatchInput[] = [
      // group B match (later alphabetically, declared first)
      {
        id: 10,
        stage: "group",
        group_id: 2,
        group_name: "B",
        home_team: teamE,
        away_team: teamF,
      },
      // group A match
      {
        id: 11,
        stage: "group",
        group_id: 1,
        group_name: "A",
        home_team: teams[A],
        away_team: teams[B],
      },
      // knockout match — must be ignored
      {
        id: 12,
        stage: "R32",
        group_id: null,
        group_name: null,
        home_team: teams[C],
        away_team: teams[D],
      },
    ];
    const groups = buildPredictedStandings(ms, []);
    expect(groups.map((g) => g.groupName)).toEqual(["A", "B"]);
    expect(groups.every((g) => g.groupId === 1 || g.groupId === 2)).toBe(true);
  });
});