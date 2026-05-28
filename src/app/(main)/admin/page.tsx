import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ResultadosTabs } from "@/components/admin/resultados-tabs";
import { CustomBetForm } from "@/components/admin/custom-bet-form";
import { CustomBetResolution } from "@/components/admin/custom-bet-resolution";
import { TournamentResolution } from "@/components/admin/tournament-resolution";
import { InviteManager } from "@/components/admin/invite-manager";
import { UserOverview } from "@/components/admin/user-overview";
import type { UserWithStats } from "@/components/admin/user-overview";
import { TeamAssignment } from "@/components/admin/team-assignment";
import { BracketConfigEditor } from "@/components/admin/bracket-config";
import type { ComboboxItem } from "@/components/search-combobox";
import { AdminTabs } from "./tabs";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/inicio");

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, kickoff_at, stage,
      home_team:teams!matches_home_team_id_fkey(name, code),
      away_team:teams!matches_away_team_id_fkey(name, code),
      group:groups(name),
      result:match_results(home_score, away_score, penalty_winner)
    `)
    .order("kickoff_at", { ascending: false });

  const { data: tournamentConfigs } = await supabase
    .from("tournament_bet_config")
    .select("category, label, answer_type, points_value, correct_answer_text, correct_answer_team_id, correct_answer_player_id")
    .order("points_value", { ascending: false });

  const { data: customBets } = await supabase
    .from("custom_bets")
    .select("id, question, bet_type, options, points_value, lock_at, correct_answer_text, correct_answer_team_id, correct_answer_player_id")
    .order("lock_at", { ascending: false });

  const { data: invites } = await supabase
    .from("invites")
    .select("id, token, used_by, allowed_emails, created_at")
    .order("created_at", { ascending: false });

  const adminSupabase = createAdminClient();

  const { data: claimCounts } = await adminSupabase
    .from("invite_claims")
    .select("invite_id");

  const claimCountMap = new Map<string, number>();
  (claimCounts ?? []).forEach((c: { invite_id: string }) => {
    claimCountMap.set(c.invite_id, (claimCountMap.get(c.invite_id) ?? 0) + 1);
  });

  const invitesWithCounts = (invites ?? []).map((inv: any) => ({
    ...inv,
    claim_count: claimCountMap.get(inv.id) ?? 0,
  }));

  const { data: profiles } = await adminSupabase
    .from("profiles")
    .select("id, display_name, avatar_emoji, is_admin, created_at")
    .order("created_at", { ascending: true });

  const { data: leaderboardRows } = await adminSupabase
    .from("leaderboard")
    .select("user_id, total_points, rank");

  const { data: allPredictions } = await adminSupabase
    .from("match_predictions")
    .select("user_id");

  const predCountMap = new Map<string, number>();
  (allPredictions ?? []).forEach((p: { user_id: string }) => {
    predCountMap.set(p.user_id, (predCountMap.get(p.user_id) ?? 0) + 1);
  });

  const leaderboardMap = new Map(
    (leaderboardRows ?? []).map((r: any) => [
      r.user_id,
      { total_points: r.total_points, rank: r.rank },
    ])
  );

  const usersWithStats: UserWithStats[] = (profiles ?? []).map((p: any) => {
    const lb = leaderboardMap.get(p.id);
    return {
      id: p.id,
      display_name: p.display_name,
      avatar_emoji: p.avatar_emoji,
      is_admin: p.is_admin,
      created_at: p.created_at,
      rank: lb?.rank ?? null,
      total_points: lb?.total_points ?? null,
      predictions_count: predCountMap.get(p.id) ?? 0,
    };
  });

  const { data: r32Matches } = await supabase
    .from("matches")
    .select(`
      id, kickoff_at, stage,
      home_team:teams!matches_home_team_id_fkey(id, name, code),
      away_team:teams!matches_away_team_id_fkey(id, name, code)
    `)
    .eq("stage", "R32")
    .order("kickoff_at");

  const { data: realTeams } = await supabase
    .from("teams")
    .select("id, name, code")
    .neq("group_id", 13)
    .order("name");

  const { data: bracketConfig } = await supabase
    .from("bracket_config")
    .select("*")
    .single();

  const { data: allTeams } = await supabase
    .from("teams")
    .select("id, name, code, group_id")
    .neq("group_id", 13)
    .order("name");

  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, name, team:teams!players_team_id_fkey(name, code)")
    .order("name");

  const teamItems: ComboboxItem[] = (allTeams ?? []).map((t: any) => ({
    id: String(t.id),
    label: `${t.name} (${t.code})`,
    searchTerms: `${t.name} ${t.code}`,
  }));

  const playerItems: ComboboxItem[] = (allPlayers ?? []).map((p: any) => ({
    id: p.id,
    label: `${p.name} — ${(p.team as any)?.name ?? ""}`,
    searchTerms: `${p.name} ${(p.team as any)?.name ?? ""} ${(p.team as any)?.code ?? ""}`,
  }));

  const formattedR32 = (r32Matches ?? []).map((m: any) => ({
    id: m.id,
    kickoff_at: m.kickoff_at,
    stage: m.stage as string,
    home_team: m.home_team as { id: number; name: string; code: string } | null,
    away_team: m.away_team as { id: number; name: string; code: string } | null,
  }));

  const formattedMatches = (matches ?? []).map((m: any) => ({
    id: m.id,
    kickoff_at: m.kickoff_at,
    stage: m.stage as string,
    home_team: m.home_team as { name: string; code: string },
    away_team: m.away_team as { name: string; code: string },
    group_name: (m.group as { name: string } | null)?.name ?? null,
    result: m.result ?? null,
  }));

  const groupMatches = formattedMatches.filter((m) => m.stage === "group");
  const knockoutMatches = formattedMatches.filter((m) => m.stage !== "group");

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Admin</h1>
      <AdminTabs
        resultadosContent={
          <ResultadosTabs
            groupMatches={groupMatches}
            knockoutMatches={knockoutMatches}
          />
        }
        apuestasContent={
          <div className="space-y-4">
            <CustomBetForm />
            <CustomBetResolution
              bets={(customBets ?? []) as any}
              teams={teamItems}
              players={playerItems}
            />
          </div>
        }
        torneoContent={
          <TournamentResolution
            configs={tournamentConfigs ?? []}
            teams={teamItems}
            players={playerItems}
          />
        }
        bracketContent={
          <div className="space-y-4">
            {bracketConfig && (
              <BracketConfigEditor config={bracketConfig} />
            )}
            <TeamAssignment
              matches={formattedR32}
              realTeams={(realTeams ?? []) as any}
            />
          </div>
        }
        invitesContent={<InviteManager invites={invitesWithCounts} />}
        usuariosContent={
          <UserOverview users={usersWithStats} currentUserId={user.id} />
        }
      />
    </div>
  );
}
