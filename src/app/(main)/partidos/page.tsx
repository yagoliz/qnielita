import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PartidosTree } from "@/components/partidos-tree";
import { PartidosTabs } from "@/components/partidos-tabs";
import {
  buildMatchTree,
  computeDefaultOpen,
  resolveActiveTab,
  sliceTree,
  type MatchInput,
  type PredictionInput,
  type ResultInput,
} from "@/lib/match-tree";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function PartidosPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;

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

  const fullTree = buildMatchTree(
    matches,
    (predictions ?? []) as PredictionInput[],
    (results ?? []) as ResultInput[]
  );
  const now = new Date();
  const activeTab = resolveActiveTab(tab, fullTree, now);
  const knockoutAvailable = fullTree.knockout.length > 0;

  const tabTree = sliceTree(fullTree, activeTab);
  const defaultOpen = computeDefaultOpen(tabTree, now);

  const tabIsEmpty =
    (activeTab === "grupos" && tabTree.groupStage.groups.length === 0) ||
    (activeTab === "eliminatorias" && tabTree.knockout.length === 0);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Partidos</h1>

      <PartidosTabs activeTab={activeTab} knockoutAvailable={knockoutAvailable} />

      {tabIsEmpty ? (
        <p className="text-gray-400 text-center mt-8">
          No hay partidos disponibles todavía.
        </p>
      ) : (
        <PartidosTree tree={tabTree} defaultOpen={defaultOpen} />
      )}
    </div>
  );
}