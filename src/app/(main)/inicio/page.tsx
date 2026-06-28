import { createClient, getUser } from "@/lib/supabase/server";
import { DeadlineBanner } from "@/components/deadline-banner";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { MatchPreviewCard } from "@/components/match-preview-card";
import { fetchFullLeaderboard } from "@/lib/leaderboard";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy, AlertTriangle, Swords } from "lucide-react";

export default async function InicioPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  // Independent queries — run them in a single parallel wave instead of
  // stacking ~9 sequential round trips before the page can render.
  const [
    allEntries,
    { data: upcomingMatches },
    { data: allFutureMatches },
    { data: myPredictions },
    { data: bracketConfig },
    { data: earliestTournamentLock },
    { data: bracketPreds },
    { data: recentResults },
  ] = await Promise.all([
    fetchFullLeaderboard(supabase as any),
    supabase
      .from("matches")
      .select(`
        id, kickoff_at, stage,
        home_team:teams!matches_home_team_id_fkey(name, code),
        away_team:teams!matches_away_team_id_fkey(name, code)
      `)
      .gt("kickoff_at", nowIso)
      .order("kickoff_at", { ascending: true })
      .limit(5),
    supabase
      .from("matches")
      .select("id")
      .eq("stage", "group")
      .gt("kickoff_at", nowIso),
    supabase
      .from("match_predictions")
      .select("match_id, home_score, away_score, points_earned")
      .eq("user_id", user.id),
    supabase.from("bracket_config").select("unlock_at, lock_at").single(),
    supabase
      .from("tournament_bet_config")
      .select("lock_at")
      .gt("lock_at", nowIso)
      .order("lock_at", { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from("bracket_predictions")
      .select(
        "match_id, predicted_home_team_id, predicted_away_team_id, home_score, away_score, team_points_earned, score_points_earned"
      )
      .eq("user_id", user.id),
    supabase
      .from("match_results")
      .select(`
        home_score, away_score,
        match:matches!match_results_match_id_fkey(
          id, kickoff_at, stage, home_team_id, away_team_id,
          home_team:teams!matches_home_team_id_fkey(name, code),
          away_team:teams!matches_away_team_id_fkey(name, code)
        )
      `)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const topEntries = allEntries.slice(0, 5);
  const myRank = allEntries.find((e) => e.user_id === user.id) ?? null;

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
  // Knockout predictions live in bracket_predictions, not match_predictions.
  // Key them by match_id so the results cards can show the user's bracket pick.
  const bracketPredsByMatch = new Map<
    number,
    {
      predicted_home_team_id: number;
      predicted_away_team_id: number;
      home_score: number;
      away_score: number;
      team_points_earned: number;
      score_points_earned: number;
    }
  >();
  (bracketPreds ?? []).forEach((p: any) => {
    bracketPredsByMatch.set(p.match_id, p);
  });

  // Resolve the prediction to display in a match card, orienting bracket picks
  // to the actual match's home/away slots (the user may have projected the
  // teams into the opposite slots).
  function predictionForMatch(match: any) {
    const direct = predictionsByMatch.get(match.id);
    if (direct) return direct;
    const bp = bracketPredsByMatch.get(match.id);
    if (!bp) return null;
    const flipped =
      bp.predicted_home_team_id === match.away_team_id ||
      bp.predicted_away_team_id === match.home_team_id;
    return {
      home_score: flipped ? bp.away_score : bp.home_score,
      away_score: flipped ? bp.home_score : bp.away_score,
      points_earned: bp.team_points_earned + bp.score_points_earned,
    };
  }

  const predictedIds = new Set(predictionsByMatch.keys());
  const pendingCount = (allFutureMatches ?? []).filter(
    (m: any) => !predictedIds.has(m.id)
  ).length;

  const GROUP_STAGE_LOCK = "2026-06-11T18:00:00Z";

  const deadlines: { label: string; targetDate: string }[] = [];
  if (new Date(GROUP_STAGE_LOCK) > new Date()) {
    deadlines.push({ label: "Cierre fase de grupos", targetDate: GROUP_STAGE_LOCK });
  }
  if (earliestTournamentLock) {
    deadlines.push({ label: "Cierre apuestas torneo", targetDate: earliestTournamentLock.lock_at });
  }

  const hasBracket = (bracketPreds ?? []).length > 0;
  const bracketOpen = bracketConfig
    && new Date(bracketConfig.unlock_at) <= new Date()
    && new Date(bracketConfig.lock_at) > new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-1.5">Qnielita <Trophy className="size-5 text-green-600" /></h1>
        <p className="text-sm text-gray-500">Porra Mundial 2026</p>
      </div>

      {deadlines.length > 0 && <DeadlineBanner deadlines={deadlines} />}

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
                  prediction={predictionForMatch(match)}
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
