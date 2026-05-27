import { describe, it, expect } from "vitest";
import { buildMatchTree } from "./match-tree";

describe("buildMatchTree", () => {
  it("returns empty tree for empty input", () => {
    const tree = buildMatchTree([], [], []);
    expect(tree.groupStage.groups).toEqual([]);
    expect(tree.knockout).toEqual([]);
  });

  it("splits a 6-match group into 3 matchdays of 2 by kickoff order", () => {
    const matches = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      kickoff_at: `2026-06-${11 + i}T18:00:00Z`,
      venue: null,
      stage: "group" as const,
      group_id: 1,
      group_name: "A",
      home_team: { name: `H${i}`, code: `H${i}` },
      away_team: { name: `A${i}`, code: `A${i}` },
    }));

    const tree = buildMatchTree(matches, [], []);
    expect(tree.groupStage.groups).toHaveLength(1);
    const group = tree.groupStage.groups[0];
    expect(group.id).toBe(1);
    expect(group.label).toBe("Grupo A");
    expect(group.totalCount).toBe(6);
    expect(group.predictedCount).toBe(0);
    expect(group.matchdays).toHaveLength(3);
    expect(group.matchdays[0].number).toBe(1);
    expect(group.matchdays[0].label).toBe("Jornada 1");
    expect(group.matchdays[0].matches.map((m) => m.id)).toEqual([1, 2]);
    expect(group.matchdays[1].matches.map((m) => m.id)).toEqual([3, 4]);
    expect(group.matchdays[2].matches.map((m) => m.id)).toEqual([5, 6]);
    expect(group.matchdays[0].key).toBe("1-1");
  });

  it("counts predictions per matchday and per group", () => {
    const matches = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      kickoff_at: `2026-06-${11 + i}T18:00:00Z`,
      venue: null,
      stage: "group" as const,
      group_id: 1,
      group_name: "A",
      home_team: { name: `H${i}`, code: `H${i}` },
      away_team: { name: `A${i}`, code: `A${i}` },
    }));
    const predictions = [
      { match_id: 1, home_score: 1, away_score: 0, points_earned: null },
      { match_id: 3, home_score: 2, away_score: 2, points_earned: null },
      { match_id: 4, home_score: 0, away_score: 1, points_earned: null },
    ];

    const tree = buildMatchTree(matches, predictions, []);
    const group = tree.groupStage.groups[0];
    expect(group.predictedCount).toBe(3);
    expect(group.matchdays[0].predictedCount).toBe(1);
    expect(group.matchdays[1].predictedCount).toBe(2);
    expect(group.matchdays[2].predictedCount).toBe(0);
    expect(group.matchdays[0].matches[0].prediction?.home_score).toBe(1);
  });

  it("places a partial pair into its own matchday (defensive)", () => {
    const matches = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      kickoff_at: `2026-06-${11 + i}T18:00:00Z`,
      venue: null,
      stage: "group" as const,
      group_id: 1,
      group_name: "A",
      home_team: { name: `H${i}`, code: `H${i}` },
      away_team: { name: `A${i}`, code: `A${i}` },
    }));

    const tree = buildMatchTree(matches, [], []);
    const group = tree.groupStage.groups[0];
    expect(group.matchdays).toHaveLength(3);
    expect(group.matchdays[2].matches).toHaveLength(1);
    expect(group.matchdays[2].totalCount).toBe(1);
  });
});