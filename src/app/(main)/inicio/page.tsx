import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { MatchPreviewCard } from "@/components/match-preview-card";
import { fetchFullLeaderboard } from "@/lib/leaderboard";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy, AlertTriangle, Swords } from "lucide-react";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const allEntries = await fetchFullLeaderboard(supabase as any);
  const topEntries = allEntries.slice(0, 5);
  const myRank = allEntries.find((e) => e.user_id === user!.id) ?? null;

  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select(`
      id, kickoff_at, stage,
      home_team:teams!matches_home_team_id_fkey(name, code),
      away_team:teams!matches_away_team_id_fkey(name, code)
    `)
    .gt("kickoff_at", new Date().toISOString())
    .order("kickoff_at", { ascending: true })
    .limit(5);

  const { data: allFutureMatches } = await supabase
    .from("matches")
    .select("id")
    .gt("kickoff_at", new Date().toISOString());

  const { data: myPredictions } = await supabase
    .from("match_predictions")
    .select("match_id, home_score, away_score, points_earned")
    .eq("user_id", user!.id);

  const predictionsByMatch = new Map<
    number,
    { home_score: number; away_score: number; points_earned: number | null }
  >();
  (myPredictions ?? []).forEach((p: any) => {
    predictionsByMatch.set(p.match_id, {
      home_score: p.home_score,
      away_score: p.away_score,
      points_earned: p.points_earned,
    });
  });
  const predictedIds = new Set(predictionsByMatch.keys());
  const pendingCount = (allFutureMatches ?? []).filter(
    (m: any) => !predictedIds.has(m.id)
  ).length;

  const { data: bracketConfig } = await supabase
    .from("bracket_config")
    .select("unlock_at, lock_at")
    .single();

  const { data: bracketPreds } = await supabase
    .from("bracket_predictions")
    .select("match_id")
    .eq("user_id", user!.id);

  const hasBracket = (bracketPreds ?? []).length > 0;
  const bracketOpen = bracketConfig
    && new Date(bracketConfig.unlock_at) <= new Date()
    && new Date(bracketConfig.lock_at) > new Date();

  const { data: recentResults } = await supabase
    .from("match_results")
    .select(`
      home_score, away_score,
      match:matches!match_results_match_id_fkey(
        id, stage,
        home_team:teams!matches_home_team_id_fkey(name, code),
        away_team:teams!matches_away_team_id_fkey(name, code)
      )
    `)
    .order("updated_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-1.5">Qnielita <Trophy className="size-5 text-green-600" /></h1>
        <p className="text-sm text-gray-500">Porra Mundial 2026</p>
      </div>

      {myRank && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-sm text-green-700">
            Estás en el puesto <span className="font-bold">#{myRank.rank}</span> con{" "}
            <span className="font-bold">{myRank.total_points} pts</span>
          </p>
        </div>
      )}

      {pendingCount > 0 && (
        <Link
          href="/partidos"
          className="block bg-yellow-50 rounded-xl p-4 border border-yellow-200"
        >
          <p className="text-sm text-yellow-800">
            <AlertTriangle className="size-4 inline mr-1" />
            Tienes <span className="font-bold">{pendingCount} partidos</span> sin
            predicción.
          </p>
        </Link>
      )}

      {bracketOpen && !hasBracket && (
        <Link
          href="/partidos?tab=eliminatorias"
          className="block bg-blue-50 rounded-xl p-4 border border-blue-200"
        >
          <p className="text-sm text-blue-800">
            <Swords className="size-4 inline mr-1" />
            ¡Las predicciones de eliminatorias están abiertas! Completa tu bracket.
          </p>
        </Link>
      )}

      {topEntries.length ? (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">
              Top 5
            </h2>
            <Link
              href="/clasificacion"
              className="text-xs text-green-600 font-medium"
            >
              Ver todo →
            </Link>
          </div>
          <LeaderboardTable
            entries={topEntries}
            currentUserId={user!.id}
            compact
          />
        </div>
      ) : null}

      {upcomingMatches?.length ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Próximos partidos
          </h2>
          <div className="space-y-2">
            {upcomingMatches.map((match: any) => (
              <MatchPreviewCard
                key={match.id}
                match={match}
                prediction={predictionsByMatch.get(match.id) ?? null}
                href="/partidos"
              />
            ))}
          </div>
        </div>
      ) : null}

      {recentResults?.length ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Últimos resultados
          </h2>
          <div className="space-y-2">
            {recentResults.map((r: any) => {
              const match = r.match;
              if (!match) return null;
              return (
                <MatchPreviewCard
                  key={match.id}
                  match={match}
                  prediction={predictionsByMatch.get(match.id) ?? null}
                  result={{ home_score: r.home_score, away_score: r.away_score }}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
