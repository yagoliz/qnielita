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
});