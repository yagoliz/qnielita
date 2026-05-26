import { createClient } from "@/lib/supabase/server";
import { TournamentBetCard } from "@/components/tournament-bet-card";
import { CustomBetCard } from "@/components/custom-bet-card";
import { ApuestasTabs } from "./tabs";

async function TorneoTab() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: configs } = await supabase
    .from("tournament_bet_config")
    .select("*")
    .order("points_value", { ascending: false });

  const { data: bets } = await supabase
    .from("tournament_bets")
    .select("category, answer, points_earned")
    .eq("user_id", user!.id);

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

  const { data: customBets } = await supabase
    .from("custom_bets")
    .select("*")
    .order("lock_at", { ascending: true });

  const { data: answers } = await supabase
    .from("custom_bet_answers")
    .select("custom_bet_id, answer, points_earned")
    .eq("user_id", user!.id);

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
