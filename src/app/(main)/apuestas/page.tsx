import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TournamentBetCard } from "@/components/tournament-bet-card";
import { CustomBetCard } from "@/components/custom-bet-card";
import { ApuestasTabs } from "./tabs";
import type { ComboboxItem } from "@/components/search-combobox";

async function loadComboboxData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, code, group_id")
    .neq("group_id", 13)
    .order("name");

  const { data: players } = await supabase
    .from("players")
    .select("id, name, team:teams!players_team_id_fkey(name, code)")
    .order("name");

  const teamItems: ComboboxItem[] = (teams ?? []).map((t: any) => ({
    id: String(t.id),
    label: `${t.name} (${t.code})`,
    searchTerms: `${t.name} ${t.code}`,
  }));

  const playerItems: ComboboxItem[] = (players ?? []).map((p: any) => ({
    id: p.id,
    label: `${p.name} — ${(p.team as any)?.name ?? ""}`,
    searchTerms: `${p.name} ${(p.team as any)?.name ?? ""} ${(p.team as any)?.code ?? ""}`,
  }));

  return { teamItems, playerItems };
}

async function TorneoTab() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ teamItems, playerItems }, { data: configs }, { data: bets }] = await Promise.all([
    loadComboboxData(supabase),
    supabase
      .from("tournament_bet_config")
      .select("*")
      .order("points_value", { ascending: false }),
    supabase
      .from("tournament_bets")
      .select("category, answer_text, answer_team_id, answer_player_id, points_earned")
      .eq("user_id", user.id),
  ]);

  const betMap = new Map(
    (bets ?? []).map((b: any) => [b.category, b])
  );

  return (
    <div className="space-y-3">
      {(configs ?? []).map((config: any) => (
        <TournamentBetCard
          key={config.category}
          config={config}
          existingBet={betMap.get(config.category) ?? undefined}
          teams={teamItems}
          players={playerItems}
        />
      ))}
    </div>
  );
}

async function LocasTab() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ teamItems, playerItems }, { data: customBets }, { data: answers }] = await Promise.all([
    loadComboboxData(supabase),
    supabase
      .from("custom_bets")
      .select("*")
      .order("lock_at", { ascending: true }),
    supabase
      .from("custom_bet_answers")
      .select("custom_bet_id, answer_text, answer_team_id, answer_player_id, points_earned")
      .eq("user_id", user.id),
  ]);

  const answerMap = new Map(
    (answers ?? []).map((a: any) => [a.custom_bet_id, a])
  );

  if (!customBets?.length) {
    return (
      <p className="text-gray-400 text-center mt-8">
        No hay apuestas locas todavía. ¡El admin las creará pronto!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {customBets.map((bet: any) => (
        <CustomBetCard
          key={bet.id}
          bet={{ ...bet, options: bet.options as string[] | null }}
          existingAnswer={answerMap.get(bet.id) ?? undefined}
          teams={teamItems}
          players={playerItems}
        />
      ))}
    </div>
  );
}

export default function ApuestasPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Apuestas</h1>
      <ApuestasTabs
        torneoContent={<TorneoTab />}
        locasContent={<LocasTab />}
      />
    </div>
  );
}