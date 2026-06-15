import { LeaderboardList } from "@/components/ranking/leaderboard-list";
import { LeaderboardPodium } from "@/components/ranking/leaderboard-podium";
import { RankingEvolutionChart } from "@/components/ranking/ranking-evolution-chart";
import { UserRankingSummary } from "@/components/ranking/user-ranking-summary";
import {
  buildRankingChartData,
  fetchFullLeaderboard,
  fetchLeaderboardHistory,
} from "@/lib/leaderboard";
import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ClasificacionPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  const supabase = await createClient();

  const [entries, history] = await Promise.all([
    fetchFullLeaderboard(supabase as any),
    fetchLeaderboardHistory(supabase as any),
  ]);
  const currentEntry = entries.find((entry) => entry.user_id === user.id) ?? null;
  const chartData = buildRankingChartData(history, user.id);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-green-100 bg-gradient-to-b from-white to-green-50 p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
          Clasificación
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          Carrera por la Qnielita
        </h1>

        {currentEntry && (
          <div className="mt-4">
            <UserRankingSummary entry={currentEntry} entries={entries} />
          </div>
        )}

        <div className="mt-4">
          <LeaderboardPodium entries={entries} />
        </div>
      </section>

      {entries.length ? (
        <>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase text-gray-500">
                Evolución
              </h2>
              <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-bold text-green-700">
                Tu línea en verde
              </span>
            </div>
            <RankingEvolutionChart data={chartData} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
              Todos
            </h2>
            <LeaderboardList entries={entries} currentUserId={user.id} />
          </section>
        </>
      ) : (
        <p className="mt-8 text-center text-gray-400">
          Todavía no hay usuarios registrados.
        </p>
      )}
    </div>
  );
}