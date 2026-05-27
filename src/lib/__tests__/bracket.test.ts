import { describe, it, expect } from "vitest";
import {
  determineWinner,
  parseBracketCode,
  buildBracketMap,
  cascadeWinner,
  cascadeLoser,
  resolveTeamForSlot,
  type MatchPick,
} from "../bracket";

describe("determineWinner", () => {
  it("returns home when home score is higher", () => {
    expect(determineWinner(2, 1, null)).toBe("home");
  });

  it("returns away when away score is higher", () => {
    expect(determineWinner(0, 3, null)).toBe("away");
  });

  it("returns penalty_winner when scores are tied", () => {
    expect(determineWinner(1, 1, "home")).toBe("home");
    expect(determineWinner(1, 1, "away")).toBe("away");
  });
});

describe("parseBracketCode", () => {
  it("parses winner codes", () => {
    expect(parseBracketCode("W73")).toEqual({ type: "winner", matchId: 73 });
    expect(parseBracketCode("W101")).toEqual({ type: "winner", matchId: 101 });
  });

  it("parses loser codes", () => {
    expect(parseBracketCode("L101")).toEqual({ type: "loser", matchId: 101 });
  });

  it("returns null for non-bracket codes", () => {
    expect(parseBracketCode("1A")).toBeNull();
    expect(parseBracketCode("ESP")).toBeNull();
    expect(parseBracketCode("3ABCDF")).toBeNull();
  });
});

describe("buildBracketMap", () => {
  it("builds mapping from matches and teams", () => {
    const teams = [
      { id: 81, code: "W74" },
      { id: 82, code: "W77" },
    ];
    const matches = [
      { id: 89, home_team_id: 81, away_team_id: 82, stage: "R16" as const },
    ];

    const map = buildBracketMap(matches, teams);
    expect(map.get(89)).toEqual({
      home: { type: "winner", matchId: 74 },
      away: { type: "winner", matchId: 77 },
    });
  });

  it("handles third-place loser codes", () => {
    const teams = [
      { id: 109, code: "L101" },
      { id: 110, code: "L102" },
    ];
    const matches = [
      { id: 103, home_team_id: 109, away_team_id: 110, stage: "third_place" as const },
    ];

    const map = buildBracketMap(matches, teams);
    expect(map.get(103)).toEqual({
      home: { type: "loser", matchId: 101 },
      away: { type: "loser", matchId: 102 },
    });
  });

  it("skips R32 and group matches", () => {
    const teams = [{ id: 49, code: "2A" }, { id: 50, code: "2B" }];
    const matches = [
      { id: 73, home_team_id: 49, away_team_id: 50, stage: "R32" as const },
    ];

    const map = buildBracketMap(matches, teams);
    expect(map.size).toBe(0);
  });
});

describe("cascadeWinner", () => {
  it("returns home team when home wins", () => {
    expect(cascadeWinner({
      homeTeamId: 5, awayTeamId: 10, homeScore: 2, awayScore: 1, penaltyWinner: null,
    })).toBe(5);
  });

  it("returns away team when away wins", () => {
    expect(cascadeWinner({
      homeTeamId: 5, awayTeamId: 10, homeScore: 0, awayScore: 1, penaltyWinner: null,
    })).toBe(10);
  });

  it("uses penalty_winner on tie", () => {
    expect(cascadeWinner({
      homeTeamId: 5, awayTeamId: 10, homeScore: 1, awayScore: 1, penaltyWinner: "away",
    })).toBe(10);
  });
});

describe("cascadeLoser", () => {
  it("returns away team when home wins", () => {
    expect(cascadeLoser({
      homeTeamId: 5, awayTeamId: 10, homeScore: 2, awayScore: 1, penaltyWinner: null,
    })).toBe(10);
  });

  it("returns home team when away wins", () => {
    expect(cascadeLoser({
      homeTeamId: 5, awayTeamId: 10, homeScore: 0, awayScore: 1, penaltyWinner: null,
    })).toBe(5);
  });
});

describe("resolveTeamForSlot", () => {
  it("returns winner team for winner entry", () => {
    const picks = new Map<number, MatchPick>([
      [73, { homeTeamId: 1, awayTeamId: 2, homeScore: 3, awayScore: 0, penaltyWinner: null }],
    ]);
    expect(resolveTeamForSlot({ type: "winner", matchId: 73 }, picks)).toBe(1);
  });

  it("returns loser team for loser entry", () => {
    const picks = new Map<number, MatchPick>([
      [101, { homeTeamId: 5, awayTeamId: 6, homeScore: 2, awayScore: 1, penaltyWinner: null }],
    ]);
    expect(resolveTeamForSlot({ type: "loser", matchId: 101 }, picks)).toBe(6);
  });

  it("returns null when pick not found", () => {
    expect(resolveTeamForSlot({ type: "winner", matchId: 99 }, new Map())).toBeNull();
  });
});
