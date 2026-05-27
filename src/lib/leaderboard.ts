import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  match_points: number;
  tournament_points: number;
  custom_points: number;
  bracket_points: number;
  total_points: number;
  rank: number;
};

export async function fetchFullLeaderboard(
  supabase: SupabaseClient
): Promise<LeaderboardEntry[]> {
  const [{ data: profiles }, { data: leaderboard }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase.from("leaderboard").select("*"),
  ]);

  const lbMap = new Map<string, LeaderboardEntry>(
    (leaderboard ?? []).map((e: any) => [e.user_id, e as LeaderboardEntry])
  );

  const merged: LeaderboardEntry[] = (profiles ?? []).map((p: any) =>
    lbMap.get(p.id) ?? {
      user_id: p.id,
      display_name: p.display_name,
      match_points: 0,
      tournament_points: 0,
      custom_points: 0,
      bracket_points: 0,
      total_points: 0,
      rank: 0,
    }
  );

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