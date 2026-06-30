import { MatchPreviewCard } from "@/components/match-preview-card";
import { RankingEvolutionChart } from "@/components/ranking/ranking-evolution-chart";
import { UserRankingSummary } from "@/components/ranking/user-ranking-summary";
import {
  buildBracketTeamComparison,
  isRealTeamCode,
  type BracketComparison,
  type ComparisonTeam,
} from "@/lib/bracket-team-comparison";
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

  const [
    allEntries,
    history,
    { data: predictions },
    { data: bracketPredictions },
    { data: teamsRows },
  ] = await Promise.all([
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
    supabase
      .from("bracket_predictions")
      .select(`
        predicted_home_team_id, predicted_away_team_id,
        home_score, away_score, team_points_earned, score_points_earned,
        match:matches!bracket_predictions_match_id_fkey(
          id, kickoff_at, stage, home_team_id, away_team_id,
          home_team:teams!matches_home_team_id_fkey(name, code),
          away_team:teams!matches_away_team_id_fkey(name, code),
          result:match_results(home_score, away_score)
        )
      `)
      .eq("user_id", userId),
    supabase.from("teams").select("id, name, code"),
  ]);

  const leaderboardEntry = allEntries.find((entry) => entry.user_id === userId) ?? null;
  const chartData = buildRankingChartData(history, userId);

  const teamsById: Record<number, ComparisonTeam> = {};
  for (const tm of (teamsRows ?? []) as ComparisonTeam[]) {
    teamsById[tm.id] = tm;
  }

  // Merge resolved group-stage picks (match_predictions) with resolved knockout
  // picks (bracket_predictions), most recent match on top.
  type ResolvedItem = {
    match: any;
    prediction: { home_score: number; away_score: number; points_earned: number };
    result: { home_score: number; away_score: number };
    comparison?: BracketComparison;
  };

  // `match_results.match_id` is the PK, so PostgREST embeds the result as a
  // single object (older versions may return a one-element array) — normalize.
  const resultOf = (match: any) => {
    const r = match?.result;
    return (Array.isArray(r) ? r[0] : r) ?? null;
  };

  const groupItems: ResolvedItem[] = (predictions ?? [])
    .map((pred: any) => {
      const match = pred.match;
      const result = resultOf(match);
      if (!match || !result) return null;
      return {
        match,
        prediction: {
          home_score: pred.home_score,
          away_score: pred.away_score,
          points_earned: pred.points_earned,
        },
        result,
      };
    })
    .filter(Boolean) as ResolvedItem[];

  const knockoutItems: ResolvedItem[] = (bracketPredictions ?? [])
    .map((bp: any) => {
      const match = bp.match;
      const result = resultOf(match);
      if (!match || !result) return null;

      const predHome = teamsById[bp.predicted_home_team_id] ?? null;
      const predAway = teamsById[bp.predicted_away_team_id] ?? null;
      const aHome: ComparisonTeam | null =
        match.home_team && isRealTeamCode(match.home_team.code)
          ? { id: match.home_team_id, name: match.home_team.name, code: match.home_team.code }
          : null;
      const aAway: ComparisonTeam | null =
        match.away_team && isRealTeamCode(match.away_team.code)
          ? { id: match.away_team_id, name: match.away_team.name, code: match.away_team.code }
          : null;

      return {
        match,
        prediction: {
          home_score: bp.home_score,
          away_score: bp.away_score,
          points_earned: bp.team_points_earned + bp.score_points_earned,
        },
        result,
        comparison: buildBracketTeamComparison(predHome, predAway, aHome, aAway),
      };
    })
    .filter(Boolean) as ResolvedItem[];

  const resolvedItems = [...groupItems, ...knockoutItems].sort(
    (a, b) =>
      new Date(b.match.kickoff_at).getTime() -
      new Date(a.match.kickoff_at).getTime()
  );

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
          {resolvedItems.map((item) => (
            <MatchPreviewCard
              key={item.match.id}
              match={item.match}
              prediction={item.prediction}
              result={{
                home_score: item.result.home_score,
                away_score: item.result.away_score,
              }}
              pointsVariant="badge"
              comparison={item.comparison}
            />
          ))}

          {resolvedItems.length === 0 && (
            <p className="mt-4 text-center text-sm text-gray-400">
              Todavía no hay predicciones resueltas.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}