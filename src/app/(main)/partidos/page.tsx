import { createClient } from "@/lib/supabase/server";
import { MatchCard } from "@/components/match-card";

const stageLabels: Record<string, string> = {
  group: "Fase de Grupos",
  R32: "Dieciseisavos",
  R16: "Octavos de Final",
  QF: "Cuartos de Final",
  SF: "Semifinales",
  third_place: "Tercer Puesto",
  final: "Final",
};

const stageOrder = ["group", "R32", "R16", "QF", "SF", "third_place", "final"];

export default async function PartidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, kickoff_at, venue, stage, group_id,
      home_team:teams!matches_home_team_id_fkey(name, code),
      away_team:teams!matches_away_team_id_fkey(name, code)
    `)
    .order("kickoff_at", { ascending: true });

  const { data: predictions } = await supabase
    .from("match_predictions")
    .select("match_id, home_score, away_score, points_earned")
    .eq("user_id", user!.id);

  const { data: results } = await supabase
    .from("match_results")
    .select("match_id, home_score, away_score");

  const predictionMap = new Map(
    (predictions ?? []).map((p: any) => [p.match_id, p])
  );
  const resultMap = new Map(
    (results ?? []).map((r: any) => [r.match_id, r])
  );

  const matchesByStage = new Map<string, any[]>();
  for (const match of matches ?? []) {
    const stage = match.stage;
    if (!matchesByStage.has(stage)) matchesByStage.set(stage, []);
    matchesByStage.get(stage)!.push(match);
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Partidos</h1>

      {stageOrder.map((stage) => {
        const stageMatches = matchesByStage.get(stage);
        if (!stageMatches?.length) return null;

        return (
          <div key={stage} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              {stageLabels[stage] ?? stage}
            </h2>
            <div className="space-y-3">
              {stageMatches.map((match: any) => (
                <MatchCard
                  key={match.id}
                  match={{
                    ...match,
                    home_team: match.home_team as { name: string; code: string },
                    away_team: match.away_team as { name: string; code: string },
                  }}
                  prediction={predictionMap.get(match.id) ?? undefined}
                  result={resultMap.get(match.id) ?? undefined}
                />
              ))}
            </div>
          </div>
        );
      })}

      {(!matches || matches.length === 0) && (
        <p className="text-gray-400 text-center mt-8">
          No hay partidos disponibles todavía.
        </p>
      )}
    </div>
  );
}
