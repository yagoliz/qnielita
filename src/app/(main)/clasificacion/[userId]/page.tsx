import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CircleDot, Trophy, Dices } from "lucide-react";
import { fetchFullLeaderboard } from "@/lib/leaderboard";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_emoji")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  const allEntries = await fetchFullLeaderboard(supabase as any);
  const leaderboardEntry = allEntries.find((e) => e.user_id === userId) ?? null;

  const { data: predictions } = await supabase
    .from("match_predictions")
    .select(`
      home_score, away_score, points_earned,
      match:matches!match_predictions_match_id_fkey(
        id, kickoff_at, stage,
        home_team:teams!matches_home_team_id_fkey(name, code),
        away_team:teams!matches_away_team_id_fkey(name, code),
        result:match_results(home_score, away_score)
      )
    `)
    .eq("user_id", userId)
    .not("points_earned", "is", null);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">
        {profile.avatar_emoji} {profile.display_name}
      </h1>

      {leaderboardEntry && (
        <p className="text-sm text-gray-500 mb-4">
          Puesto #{leaderboardEntry.rank} — {leaderboardEntry.total_points} pts
          (<CircleDot className="size-3.5 inline" /> {leaderboardEntry.match_points} | <Trophy className="size-3.5 inline" /> {leaderboardEntry.tournament_points} | <Dices className="size-3.5 inline" /> {leaderboardEntry.custom_points})
        </p>
      )}

      <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
        Predicciones resueltas
      </h2>

      <div className="space-y-2">
        {(predictions ?? []).map((pred: any) => {
          const match = pred.match;
          const result = match?.result?.[0];
          return (
            <div
              key={match?.id}
              className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-sm"
            >
              <div className="flex justify-between items-center">
                <span>
                  {match?.home_team?.code} {pred.home_score}-{pred.away_score} {match?.away_team?.code}
                </span>
                <span className="font-bold text-green-600">
                  +{pred.points_earned} pts
                </span>
              </div>
              {result && (
                <p className="text-xs text-gray-400 mt-1">
                  Resultado real: {result.home_score}-{result.away_score}
                </p>
              )}
            </div>
          );
        })}

        {(!predictions || predictions.length === 0) && (
          <p className="text-gray-400 text-center mt-4 text-sm">
            Todavía no hay predicciones resueltas.
          </p>
        )}
      </div>
    </div>
  );
}
