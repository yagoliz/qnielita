import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  avatar_emoji: string | null;
  match_points: number;
  tournament_points: number;
  custom_points: number;
  bracket_points: number;
  total_points: number;
  rank: number;
};

export type LeaderboardHistoryEntry = {
  user_id: string;
  display_name: string;
  match_points: number;
  tournament_points: number;
  custom_points: number;
  bracket_points: number;
  total_points: number;
  rank: number;
  snapshot_at: string;
};

export type RankingChartSeries = {
  userId: string;
  name: string;
  isCurrentUser: boolean;
};

export type RankingChartPoint = {
  snapshot_at: string;
  label: string;
} & Record<string, string | number>;

export type RankingChartData = {
  points: RankingChartPoint[];
  series: RankingChartSeries[];
  hasEnoughSnapshots: boolean;
};

const DEFAULT_AVATAR = "⚽";

function formatSnapshotLabel(snapshotAt: string): string {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(snapshotAt));
}

export async function fetchFullLeaderboard(
  supabase: SupabaseClient
): Promise<LeaderboardEntry[]> {
  const [{ data: profiles }, { data: leaderboard }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_emoji"),
    supabase.from("leaderboard").select("*"),
  ]);

  const lbMap = new Map<string, Omit<LeaderboardEntry, "avatar_emoji">>(
    (leaderboard ?? []).map((e: any) => [e.user_id, e as Omit<LeaderboardEntry, "avatar_emoji">])
  );

  const merged: LeaderboardEntry[] = (profiles ?? []).map((p: any) => {
    const entry = lbMap.get(p.id);
    return entry
      ? { ...entry, avatar_emoji: p.avatar_emoji ?? DEFAULT_AVATAR }
      : {
          user_id: p.id,
          display_name: p.display_name,
          avatar_emoji: p.avatar_emoji ?? DEFAULT_AVATAR,
          match_points: 0,
          tournament_points: 0,
          custom_points: 0,
          bracket_points: 0,
          total_points: 0,
          rank: 0,
        };
  });

  merged.sort(
    (a, b) =>
      b.total_points - a.total_points ||
      a.display_name.localeCompare(b.display_name)
  );

  let lastPoints = Number.NaN;
  let lastRank = 0;
  for (const entry of merged) {
    if (entry.total_points !== lastPoints) {
      lastRank++;
      lastPoints = entry.total_points;
    }
    entry.rank = lastRank;
  }

  return merged;
}

export async function fetchLeaderboardHistory(
  supabase: SupabaseClient,
  limit = 240
): Promise<LeaderboardHistoryEntry[]> {
  const { data } = await supabase
    .from("leaderboard_history")
    .select(
      "user_id, display_name, match_points, tournament_points, custom_points, bracket_points, total_points, rank, snapshot_at"
    )
    .order("snapshot_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as LeaderboardHistoryEntry[]).reverse();
}

export async function fetchUserLeaderboardHistory(
  supabase: SupabaseClient,
  userId: string,
  limit = 120
): Promise<LeaderboardHistoryEntry[]> {
  const { data } = await supabase
    .from("leaderboard_history")
    .select(
      "user_id, display_name, match_points, tournament_points, custom_points, bracket_points, total_points, rank, snapshot_at"
    )
    .eq("user_id", userId)
    .order("snapshot_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as LeaderboardHistoryEntry[]).reverse();
}

export function buildRankingChartData(
  history: LeaderboardHistoryEntry[],
  currentUserId: string
): RankingChartData {
  const seriesMap = new Map<string, RankingChartSeries>();
  const snapshots = new Map<string, RankingChartPoint>();

  for (const row of history) {
    if (!seriesMap.has(row.user_id)) {
      seriesMap.set(row.user_id, {
        userId: row.user_id,
        name: row.display_name,
        isCurrentUser: row.user_id === currentUserId,
      });
    }

    const point = snapshots.get(row.snapshot_at) ?? {
      snapshot_at: row.snapshot_at,
      label: formatSnapshotLabel(row.snapshot_at),
    };
    point[row.user_id] = row.rank;
    snapshots.set(row.snapshot_at, point);
  }

  const points = Array.from(snapshots.values()).sort((a, b) =>
    String(a.snapshot_at).localeCompare(String(b.snapshot_at))
  );

  return {
    points,
    series: Array.from(seriesMap.values()),
    hasEnoughSnapshots: points.length >= 2,
  };
}