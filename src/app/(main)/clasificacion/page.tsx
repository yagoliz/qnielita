import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard-table";

export default async function ClasificacionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("leaderboard")
    .select("*")
    .order("rank", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Clasificación</h1>

      {entries?.length ? (
        <LeaderboardTable entries={entries} currentUserId={user!.id} />
      ) : (
        <p className="text-gray-400 text-center mt-8">
          La clasificación aparecerá cuando se registren los primeros resultados.
        </p>
      )}
    </div>
  );
}
