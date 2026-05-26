import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResultEntryForm } from "@/components/admin/result-entry-form";
import { CustomBetForm } from "@/components/admin/custom-bet-form";
import { TournamentResolution } from "@/components/admin/tournament-resolution";
import { InviteManager } from "@/components/admin/invite-manager";
import { AdminTabs } from "./tabs";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user!.id)
    .single();

  if (!profile?.is_admin) redirect("/inicio");

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, kickoff_at, stage,
      home_team:teams!matches_home_team_id_fkey(name, code),
      away_team:teams!matches_away_team_id_fkey(name, code),
      result:match_results(home_score, away_score)
    `)
    .order("kickoff_at", { ascending: false });

  const { data: tournamentConfigs } = await supabase
    .from("tournament_bet_config")
    .select("category, label, points_value, correct_answer")
    .order("points_value", { ascending: false });

  const { data: invites } = await supabase
    .from("invites")
    .select("id, token, used_by, created_at")
    .order("created_at", { ascending: false });

  const formattedMatches = (matches ?? []).map((m: any) => ({
    id: m.id,
    kickoff_at: m.kickoff_at,
    home_team: m.home_team as { name: string; code: string },
    away_team: m.away_team as { name: string; code: string },
    result: m.result?.[0] ?? null,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Admin</h1>
      <AdminTabs
        resultadosContent={<ResultEntryForm matches={formattedMatches} />}
        apuestasContent={<CustomBetForm />}
        torneoContent={<TournamentResolution configs={tournamentConfigs ?? []} />}
        invitesContent={<InviteManager invites={invites ?? []} />}
      />
    </div>
  );
}
