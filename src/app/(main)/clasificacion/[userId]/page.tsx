import { RankingEvolutionChart } from "@/components/ranking/ranking-evolution-chart";
import { UserRankingSummary } from "@/components/ranking/user-ranking-summary";
import {
  buildRankingChartData,
  fetchFullLeaderboard,
  fetchUserLeaderboardHistory,
} from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

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

  const [allEntries, history, { data: predictions }] = await Promise.all([
    fetchFullLeaderboard(supabase as any),
    fetchUserLeaderboardHistory(supabase as any, userId),
    supabase
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
      .not("points_earned", "is", null),
  ]);

  const leaderboardEntry = allEntries.find((entry) => entry.user_id === userId) ?? null;
  const chartData = buildRankingChartData(history, userId);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
          Participante
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {profile.avatar_emoji} {profile.display_name}
        </h1>
      </div>

      {leaderboardEntry && (
        <UserRankingSummary
          entry={leaderboardEntry}
          entries={allEntries}
          title="Puesto actual"
        />
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
          Evolución
        </h2>
        <RankingEvolutionChart data={chartData} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
          Predicciones resueltas
        </h2>

        <div className="space-y-2">
          {(predictions ?? []).map((pred: any) => {
            const match = pred.match;
            const result = match?.result?.[0];
            return (
              <div
                key={match?.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {match?.home_team?.code} {pred.home_score}-{pred.away_score} {match?.away_team?.code}
                    </p>
                    {result && (
                      <p className="mt-1 text-xs text-gray-400">
                        Resultado real: {result.home_score}-{result.away_score}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-black text-green-700">
                    +{pred.points_earned} pts
                  </span>
                </div>
              </div>
            );
          })}

          {(!predictions || predictions.length === 0) && (
            <p className="mt-4 text-center text-sm text-gray-400">
              Todavía no hay predicciones resueltas.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}