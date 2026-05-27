import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PartidosTree } from "@/components/partidos-tree";
import {
  buildMatchTree,
  computeDefaultOpen,
  type MatchInput,
  type PredictionInput,
  type ResultInput,
} from "@/lib/match-tree";

export default async function PartidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: matchesRaw } = await supabase
    .from("matches")
    .select(`
      id, kickoff_at, venue, stage, group_id,
      home_team:teams!matches_home_team_id_fkey(name, code),
      away_team:teams!matches_away_team_id_fkey(name, code),
      group:groups(name)
    `)
    .order("kickoff_at", { ascending: true });

  const { data: predictions } = await supabase
    .from("match_predictions")
    .select("match_id, home_score, away_score, points_earned")
    .eq("user_id", user.id);

  const { data: results } = await supabase
    .from("match_results")
    .select("match_id, home_score, away_score");

  const matches: MatchInput[] = (matchesRaw ?? []).map((m: any) => ({
    id: m.id,
    kickoff_at: m.kickoff_at,
    venue: m.venue,
    stage: m.stage,
    group_id: m.group_id,
    group_name: m.group?.name ?? null,
    home_team: m.home_team,
    away_team: m.away_team,
  }));

  const tree = buildMatchTree(
    matches,
    (predictions ?? []) as PredictionInput[],
    (results ?? []) as ResultInput[]
  );
  const defaultOpen = computeDefaultOpen(tree, new Date());

  const empty = !matches.length;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Partidos</h1>

      {empty ? (
        <p className="text-gray-400 text-center mt-8">
          No hay partidos disponibles todavía.
        </p>
      ) : (
        <PartidosTree tree={tree} defaultOpen={defaultOpen} />
      )}
    </div>
  );
}