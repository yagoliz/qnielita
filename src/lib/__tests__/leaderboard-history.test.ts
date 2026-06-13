import { describe, expect, it } from "vitest";
import { buildRankingChartData, type LeaderboardHistoryEntry } from "../leaderboard";

const history: LeaderboardHistoryEntry[] = [
  {
    user_id: "u1",
    display_name: "Ana",
    match_points: 5,
    tournament_points: 0,
    custom_points: 0,
    bracket_points: 0,
    total_points: 5,
    rank: 1,
    snapshot_at: "2026-06-13T10:00:00.000Z",
  },
  {
    user_id: "u2",
    display_name: "Luis",
    match_points: 3,
    tournament_points: 0,
    custom_points: 0,
    bracket_points: 0,
    total_points: 3,
    rank: 2,
    snapshot_at: "2026-06-13T10:00:00.000Z",
  },
  {
    user_id: "u1",
    display_name: "Ana",
    match_points: 5,
    tournament_points: 4,
    custom_points: 0,
    bracket_points: 0,
    total_points: 9,
    rank: 2,
    snapshot_at: "2026-06-13T12:00:00.000Z",
  },
  {
    user_id: "u2",
    display_name: "Luis",
    match_points: 10,
    tournament_points: 0,
    custom_points: 0,
    bracket_points: 0,
    total_points: 10,
    rank: 1,
    snapshot_at: "2026-06-13T12:00:00.000Z",
  },
];

describe("buildRankingChartData", () => {
  it("groups rank history by snapshot and marks the current user series", () => {
    const chart = buildRankingChartData(history, "u2");

    expect(chart.points).toEqual([
      {
        snapshot_at: "2026-06-13T10:00:00.000Z",
        label: "13 jun, 12:00",
        u1: 1,
        u2: 2,
      },
      {
        snapshot_at: "2026-06-13T12:00:00.000Z",
        label: "13 jun, 14:00",
        u1: 2,
        u2: 1,
      },
    ]);
    expect(chart.series).toEqual([
      { userId: "u1", name: "Ana", isCurrentUser: false },
      { userId: "u2", name: "Luis", isCurrentUser: true },
    ]);
    expect(chart.hasEnoughSnapshots).toBe(true);
  });

  it("reports insufficient data for fewer than two distinct snapshots", () => {
    const chart = buildRankingChartData(history.slice(0, 2), "u1");

    expect(chart.points).toHaveLength(1);
    expect(chart.hasEnoughSnapshots).toBe(false);
  });
});