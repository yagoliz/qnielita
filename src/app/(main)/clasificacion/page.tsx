import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { fetchFullLeaderboard } from "@/lib/leaderboard";

export default async function ClasificacionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const entries = await fetchFullLeaderboard(supabase as any);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Clasificación</h1>

      {entries.length ? (
        <LeaderboardTable entries={entries} currentUserId={user!.id} />
      ) : (
        <p className="text-gray-400 text-center mt-8">
          Todavía no hay usuarios registrados.
        </p>
      )}
    </div>
  );
}