"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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

  if (isNaN(matchId) || isNaN(homeScore) || isNaN(awayScore)) {
    return { error: "Datos inválidos." };
  }

  const { error } = await supabase
    .from("match_results")
    .upsert(
      {
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        source: "manual" as const,
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
  const correctAnswer = formData.get("correct_answer") as string;

  if (!betId || !correctAnswer) {
    return { error: "Debes indicar la respuesta correcta." };
  }

  const { error } = await supabase
    .from("custom_bets")
    .update({ correct_answer: correctAnswer })
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

export async function resolveTournamentBet(formData: FormData) {
  const { supabase } = await requireAdmin();

  const category = formData.get("category") as string;
  const correctAnswer = formData.get("correct_answer") as string;

  if (!category || !correctAnswer) {
    return { error: "Debes indicar la respuesta correcta." };
  }

  const { error } = await supabase
    .from("tournament_bet_config")
    .update({ correct_answer: correctAnswer })
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

export async function generateInvite(emails?: string[]) {
  const { supabase, user } = await requireAdmin();

  const insertData: Record<string, unknown> = { created_by: user.id };
  if (emails && emails.length > 0) {
    insertData.allowed_emails = emails.map((e) => e.toLowerCase().trim());
  }

  const { data, error } = await supabase
    .from("invites")
    .insert(insertData)
    .select("token")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { token: data.token };
}

export async function toggleUserAdmin(userId: string) {
  const { supabase, user } = await requireAdmin();

  if (userId === user.id) {
    return { error: "No puedes cambiar tu propio rol de admin." };
  }

  const { data: target, error: fetchError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (fetchError || !target) return { error: "Usuario no encontrado." };

  const { error } = await supabase
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
  const { supabase } = await requireAdmin();

  const updates: Record<string, string> = {};
  if (data.display_name?.trim()) updates.display_name = data.display_name.trim();
  if (data.avatar_emoji?.trim()) updates.avatar_emoji = data.avatar_emoji.trim();

  if (Object.keys(updates).length === 0) {
    return { error: "No hay cambios." };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/clasificacion");
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
