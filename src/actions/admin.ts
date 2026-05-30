"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  computeGroupStandings,
  resolveGroupCode,
  type GroupStageResult,
  type Standing,
} from "@/lib/group-standings";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("No autorizado");

  return { supabase, user };
}

export async function submitMatchResult(formData: FormData) {
  const { supabase } = await requireAdmin();

  const matchId = parseInt(formData.get("match_id") as string, 10);
  const homeScore = parseInt(formData.get("home_score") as string, 10);
  const awayScore = parseInt(formData.get("away_score") as string, 10);
  const stage = formData.get("stage") as string;
  const penaltyWinnerRaw = formData.get("penalty_winner") as string | null;

  if (isNaN(matchId) || isNaN(homeScore) || isNaN(awayScore)) {
    return { error: "Datos inválidos." };
  }

  const isKnockout = stage !== "group";
  const isTied = homeScore === awayScore;

  if (isKnockout && isTied && !penaltyWinnerRaw) {
    return { error: "Debes indicar quién avanzó en penaltis." };
  }

  const penaltyWinner =
    isKnockout && isTied ? penaltyWinnerRaw : null;

  const { error } = await supabase
    .from("match_results")
    .upsert(
      {
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        penalty_winner: penaltyWinner,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id" }
    );

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/partidos");
  revalidatePath("/clasificacion");
  revalidatePath("/inicio");
  return { success: true };
}

export async function createCustomBet(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const question = formData.get("question") as string;
  const betType = formData.get("bet_type") as string;
  const pointsValue = parseInt(formData.get("points_value") as string, 10);
  const lockAt = formData.get("lock_at") as string;
  const optionsRaw = formData.get("options") as string;

  if (!question || !betType || !lockAt || isNaN(pointsValue)) {
    return { error: "Todos los campos son obligatorios." };
  }

  const options =
    betType === "multiple_choice" && optionsRaw
      ? optionsRaw.split(",").map((o) => o.trim()).filter(Boolean)
      : null;

  const { error } = await supabase.from("custom_bets").insert({
    question,
    bet_type: betType,
    options,
    points_value: pointsValue,
    lock_at: lockAt,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/apuestas");
  return { success: true };
}

export async function resolveCustomBet(formData: FormData) {
  const { supabase } = await requireAdmin();

  const betId = formData.get("bet_id") as string;
  const betType = formData.get("bet_type") as string;

  if (!betId || !betType) {
    return { error: "Datos incompletos." };
  }

  const update: Record<string, unknown> = {
    correct_answer_text: null,
    correct_answer_team_id: null,
    correct_answer_player_id: null,
  };

  if (betType === "team") {
    const teamId = formData.get("correct_answer_team_id") as string;
    if (!teamId) return { error: "Debes seleccionar un equipo." };
    update.correct_answer_team_id = parseInt(teamId, 10);
  } else if (betType === "player") {
    const playerId = formData.get("correct_answer_player_id") as string;
    if (!playerId) return { error: "Debes seleccionar un jugador." };
    update.correct_answer_player_id = playerId;
  } else {
    const text = (formData.get("correct_answer_text") as string)?.trim();
    if (!text) return { error: "Debes indicar la respuesta correcta." };
    update.correct_answer_text = text;
  }

  const { error } = await supabase
    .from("custom_bets")
    .update(update)
    .eq("id", betId);

  if (error) return { error: error.message };

  await supabase.rpc("recalculate_custom_bet_scores", { p_bet_id: betId });
  await supabase.rpc("recalculate_leaderboard");

  revalidatePath("/admin");
  revalidatePath("/apuestas");
  revalidatePath("/clasificacion");
  revalidatePath("/inicio");
  return { success: true };
}

export async function deleteCustomBet(betId: string) {
  await requireAdmin();

  if (!betId) return { error: "Falta el identificador de la apuesta." };

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("custom_bets")
    .delete()
    .eq("id", betId);

  if (error) return { error: error.message };

  await adminSupabase.rpc("recalculate_leaderboard");

  revalidatePath("/admin");
  revalidatePath("/apuestas");
  revalidatePath("/clasificacion");
  revalidatePath("/inicio");
  return { success: true };
}

export async function resolveTournamentBet(formData: FormData) {
  const { supabase } = await requireAdmin();

  const category = formData.get("category") as string;
  const answerType = formData.get("answer_type") as string;

  if (!category || !answerType) {
    return { error: "Datos incompletos." };
  }

  const update: Record<string, unknown> = {
    correct_answer_text: null,
    correct_answer_team_id: null,
    correct_answer_player_id: null,
  };

  if (answerType === "team") {
    const teamId = formData.get("correct_answer_team_id") as string;
    if (!teamId) return { error: "Debes seleccionar un equipo." };
    update.correct_answer_team_id = parseInt(teamId, 10);
  } else if (answerType === "player") {
    const playerId = formData.get("correct_answer_player_id") as string;
    if (!playerId) return { error: "Debes seleccionar un jugador." };
    update.correct_answer_player_id = playerId;
  } else {
    const text = (formData.get("correct_answer_text") as string)?.trim();
    if (!text) return { error: "Debes indicar la respuesta correcta." };
    update.correct_answer_text = text;
  }

  const { error } = await supabase
    .from("tournament_bet_config")
    .update(update)
    .eq("category", category);

  if (error) return { error: error.message };

  await supabase.rpc("recalculate_tournament_scores", { p_category: category });
  await supabase.rpc("recalculate_leaderboard");

  revalidatePath("/admin");
  revalidatePath("/apuestas");
  revalidatePath("/clasificacion");
  revalidatePath("/inicio");
  return { success: true };
}

export async function assignKnockoutTeam(formData: FormData) {
  const { supabase } = await requireAdmin();

  const matchId = parseInt(formData.get("match_id") as string, 10);
  const homeTeamId = parseInt(formData.get("home_team_id") as string, 10);
  const awayTeamId = parseInt(formData.get("away_team_id") as string, 10);

  if (isNaN(matchId) || isNaN(homeTeamId) || isNaN(awayTeamId)) {
    return { error: "Datos inválidos." };
  }

  if (homeTeamId === awayTeamId) {
    return { error: "Los equipos deben ser diferentes." };
  }

  const { error } = await supabase
    .from("matches")
    .update({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
    })
    .eq("id", matchId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/partidos");
  return { success: true };
}

export async function autoFillR32FromGroups(): Promise<
  | { error: string }
  | {
      assigned: number;
      skipped: Array<{ matchId: number; code: string; reason: string }>;
    }
> {
  const { supabase } = await requireAdmin();

  const { data: groupMatches, error: groupErr } = await supabase
    .from("matches")
    .select(
      "id, group_id, home_team_id, away_team_id, match_results(home_score, away_score)"
    )
    .eq("stage", "group");
  if (groupErr) return { error: groupErr.message };

  const missing = (groupMatches ?? []).filter(
    (m) => !m.match_results || (Array.isArray(m.match_results) && m.match_results.length === 0)
  );
  if (missing.length > 0) {
    return {
      error: `Faltan resultados de fase de grupos (${missing.length} partidos pendientes).`,
    };
  }

  const { data: groups, error: groupsErr } = await supabase
    .from("groups")
    .select("id, name");
  if (groupsErr) return { error: groupsErr.message };

  const { data: teams, error: teamsErr } = await supabase
    .from("teams")
    .select("id, code, group_id");
  if (teamsErr) return { error: teamsErr.message };

  const { data: r32Matches, error: r32Err } = await supabase
    .from("matches")
    .select(
      "id, home_team_id, away_team_id, home:home_team_id(code), away:away_team_id(code)"
    )
    .eq("stage", "R32");
  if (r32Err) return { error: r32Err.message };

  const groupNameById = new Map<number, string>(
    (groups ?? []).map((g) => [g.id, g.name])
  );
  const teamsByGroupName = new Map<string, number[]>();
  for (const t of teams ?? []) {
    const name = groupNameById.get(t.group_id);
    if (!name || name === "KO") continue;
    const list = teamsByGroupName.get(name) ?? [];
    list.push(t.id);
    teamsByGroupName.set(name, list);
  }

  const resultsByGroupName = new Map<string, GroupStageResult[]>();
  for (const m of groupMatches ?? []) {
    if (m.group_id == null) continue;
    const name = groupNameById.get(m.group_id);
    if (!name) continue;
    const res = Array.isArray(m.match_results) ? m.match_results[0] : m.match_results;
    if (!res) continue;
    const list = resultsByGroupName.get(name) ?? [];
    list.push({
      match_id: m.id,
      group_id: m.group_id,
      home_team_id: m.home_team_id!,
      away_team_id: m.away_team_id!,
      home_score: res.home_score,
      away_score: res.away_score,
    });
    resultsByGroupName.set(name, list);
  }

  const standingsByGroupName = new Map<string, Standing[]>();
  for (const [name, teamIds] of teamsByGroupName) {
    const results = resultsByGroupName.get(name) ?? [];
    standingsByGroupName.set(name, computeGroupStandings(teamIds, results));
  }

  type Pending = { matchId: number; homeId: number; awayId: number };
  const updates: Pending[] = [];
  const skipped: Array<{ matchId: number; code: string; reason: string }> = [];

  for (const m of r32Matches ?? []) {
    const homeCode = (m.home as unknown as { code: string } | null)?.code ?? "";
    const awayCode = (m.away as unknown as { code: string } | null)?.code ?? "";

    let homeId = m.home_team_id!;
    let awayId = m.away_team_id!;
    let touched = false;

    if (/^[12][A-L]$/.test(homeCode)) {
      const resolved = resolveGroupCode(homeCode, standingsByGroupName);
      if (resolved == null) {
        skipped.push({ matchId: m.id, code: homeCode, reason: "Empate sin desempatar" });
      } else {
        homeId = resolved;
        touched = true;
      }
    }
    if (/^[12][A-L]$/.test(awayCode)) {
      const resolved = resolveGroupCode(awayCode, standingsByGroupName);
      if (resolved == null) {
        skipped.push({ matchId: m.id, code: awayCode, reason: "Empate sin desempatar" });
      } else {
        awayId = resolved;
        touched = true;
      }
    }

    if (touched && homeId !== awayId) {
      updates.push({ matchId: m.id, homeId, awayId });
    }
  }

  let assigned = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from("matches")
      .update({ home_team_id: u.homeId, away_team_id: u.awayId })
      .eq("id", u.matchId);
    if (error) return { error: error.message };
    assigned++;
  }

  revalidatePath("/admin");
  revalidatePath("/partidos");
  return { assigned, skipped };
}

export async function updateBracketConfig(formData: FormData) {
  const { supabase } = await requireAdmin();

  const unlockAt = formData.get("unlock_at") as string;
  const lockAt = formData.get("lock_at") as string;

  if (!unlockAt || !lockAt) {
    return { error: "Ambas fechas son obligatorias." };
  }

  if (new Date(lockAt) <= new Date(unlockAt)) {
    return { error: "La fecha de cierre debe ser posterior a la de apertura." };
  }

  const { error } = await supabase
    .from("bracket_config")
    .update({
      unlock_at: unlockAt,
      lock_at: lockAt,
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/partidos");
  return { success: true };
}

export async function generateInvite(maxClaims: number) {
  const { supabase, user } = await requireAdmin();

  if (!maxClaims || maxClaims < 1) {
    return { error: "El número de plazas debe ser al menos 1." };
  }

  const { data, error } = await supabase
    .from("invites")
    .insert({ created_by: user.id, max_claims: maxClaims })
    .select("token")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { token: data.token };
}

export async function deleteInvite(inviteId: string) {
  await requireAdmin();

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("invites")
    .delete()
    .eq("id", inviteId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function toggleUserAdmin(userId: string) {
  const { user } = await requireAdmin();

  if (userId === user.id) {
    return { error: "No puedes cambiar tu propio rol de admin." };
  }

  const adminSupabase = createAdminClient();

  const { data: target, error: fetchError } = await adminSupabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (fetchError || !target) return { error: "Usuario no encontrado." };

  const { error } = await adminSupabase
    .from("profiles")
    .update({ is_admin: !target.is_admin })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function updateUserProfile(
  userId: string,
  data: { display_name?: string; avatar_emoji?: string }
) {
  await requireAdmin();

  const updates: Record<string, string> = {};
  if (data.display_name?.trim()) updates.display_name = data.display_name.trim();
  if (data.avatar_emoji?.trim()) updates.avatar_emoji = data.avatar_emoji.trim();

  if (Object.keys(updates).length === 0) {
    return { error: "No hay cambios." };
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/clasificacion");
  return { success: true };
}

export async function adminChangePassword(userId: string, newPassword: string) {
  await requireAdmin();

  if (!newPassword || newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function removeUser(userId: string) {
  const { user } = await requireAdmin();

  if (userId === user.id) {
    return { error: "No puedes eliminarte a ti mismo." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/clasificacion");
  return { success: true };
}
