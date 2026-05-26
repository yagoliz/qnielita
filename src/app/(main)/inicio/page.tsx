import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard-table";
import Link from "next/link";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: topEntries } = await supabase
    .from("leaderboard")
    .select("*")
    .order("rank", { ascending: true })
    .limit(5);

  const { data: myRank } = await supabase
    .from("leaderboard")
    .select("rank, total_points")
    .eq("user_id", user!.id)
    .single();

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
    .select("match_id")
    .eq("user_id", user!.id);

  const predictedIds = new Set((myPredictions ?? []).map((p: any) => p.match_id));
  const pendingCount = (allFutureMatches ?? []).filter(
    (m: any) => !predictedIds.has(m.id)
  ).length;

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
        <h1 className="text-xl font-bold">Qnielita ⚽</h1>
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
            ⚠️ Tienes <span className="font-bold">{pendingCount} partidos</span> sin
            predicción.
          </p>
        </Link>
      )}

      {topEntries?.length ? (
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
            {upcomingMatches.map((match: any) => {
              const home = match.home_team;
              const away = match.away_team;
              return (
                <Link
                  key={match.id}
                  href="/partidos"
                  className="block bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">
                      {home?.code} vs {away?.code}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(match.kickoff_at).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </Link>
              );
            })}
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
              return (
                <div
                  key={match?.id}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-sm"
                >
                  <span>
                    {match?.home_team?.code} {r.home_score}-{r.away_score}{" "}
                    {match?.away_team?.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
