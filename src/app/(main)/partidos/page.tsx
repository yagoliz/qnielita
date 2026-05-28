import { createClient } from "@/lib/supabase/server";
import { DeadlineBanner } from "@/components/deadline-banner";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { PartidosTree } from "@/components/partidos-tree";
import { PartidosTabs, type BracketStatus } from "@/components/partidos-tabs";
import { BracketView } from "@/components/bracket/bracket-view";
import { buildBracketMap } from "@/lib/bracket";
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

  const { data: bracketConfig } = await supabase
    .from("bracket_config")
    .select("*")
    .single();

  const GROUP_STAGE_LOCK = "2026-06-11T18:00:00Z";

  const now = new Date();
  let bracketStatus: BracketStatus = "not_open";
  if (bracketConfig) {
    const unlock = new Date(bracketConfig.unlock_at);
    const lock = new Date(bracketConfig.lock_at);
    if (now >= lock) bracketStatus = "locked";
    else if (now >= unlock) bracketStatus = "open";
  }

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
  const activeTab = resolveActiveTab(tab, fullTree, now);

  let bracketData = null;
  if (activeTab === "eliminatorias" && bracketStatus !== "not_open") {
    const { data: allTeams } = await supabase
      .from("teams")
      .select("id, name, code");

    const { data: knockoutMatches } = await supabase
      .from("matches")
      .select("id, kickoff_at, stage, home_team_id, away_team_id")
      .neq("stage", "group")
      .order("kickoff_at");

    const { data: bracketPredictions } = await supabase
      .from("bracket_predictions")
      .select("*")
      .eq("user_id", user.id);

    const knockoutIds = (knockoutMatches ?? []).map((m: any) => m.id);
    const { data: knockoutResults } = await supabase
      .from("match_results")
      .select("match_id, home_score, away_score")
      .in("match_id", knockoutIds.length > 0 ? knockoutIds : [-1]);

    const teamsById: Record<number, { id: number; name: string; code: string }> = {};
    for (const t of allTeams ?? []) {
      teamsById[(t as any).id] = t as any;
    }

    const bracketMapEntries = buildBracketMap(
      (knockoutMatches ?? []) as any[],
      (allTeams ?? []) as any[]
    );

    bracketData = {
      matches: (knockoutMatches ?? []) as any[],
      teamsById,
      bracketMap: Array.from(bracketMapEntries.entries()),
      existingPredictions: (bracketPredictions ?? []) as any[],
      results: (knockoutResults ?? []) as any[],
      locked: bracketStatus !== "open",
    };
  }

  const tabTree = sliceTree(fullTree, activeTab);
  const defaultOpen = computeDefaultOpen(tabTree, now);

  const showGroupTree = activeTab === "grupos" && tabTree.groupStage.groups.length > 0;

  const partidosDeadlines: { label: string; targetDate: string }[] = [];
  if (activeTab === "grupos" && new Date(GROUP_STAGE_LOCK) > now) {
    partidosDeadlines.push({ label: "Cierre fase de grupos", targetDate: GROUP_STAGE_LOCK });
  }
  if (activeTab === "eliminatorias" && bracketConfig && new Date(bracketConfig.lock_at) > now) {
    partidosDeadlines.push({ label: "Cierre bracket eliminatorias", targetDate: bracketConfig.lock_at });
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Partidos</h1>

      {partidosDeadlines.length > 0 && (
        <div className="mb-4">
          <DeadlineBanner deadlines={partidosDeadlines} />
        </div>
      )}

      <PartidosTabs
        activeTab={activeTab}
        knockoutAvailable={true}
        bracketStatus={bracketStatus}
      />

      {activeTab === "grupos" && (
        showGroupTree ? (
          <PartidosTree tree={tabTree} defaultOpen={defaultOpen} />
        ) : (
          <p className="text-gray-400 text-center mt-8">
            No hay partidos disponibles todavía.
          </p>
        )
      )}

      {activeTab === "eliminatorias" && bracketStatus === "not_open" && (
        <div className="text-center mt-12 space-y-3">
          <Lock className="size-8 text-gray-300 mx-auto" />
          <p className="text-gray-500 text-sm">
            Las predicciones de eliminatorias se habilitarán después de la fase de grupos.
          </p>
          {bracketConfig && (
            <p className="text-xs text-gray-400">
              Se abre el{" "}
              {new Date(bracketConfig.unlock_at).toLocaleDateString("es", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      )}

      {activeTab === "eliminatorias" && bracketStatus !== "not_open" && bracketData && (
        <BracketView {...bracketData} />
      )}
    </div>
  );
}