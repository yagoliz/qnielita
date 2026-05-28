"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitTournamentBet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const category = formData.get("category") as string;
  const answerType = formData.get("answer_type") as string;

  if (!category || !answerType) {
    return { error: "Datos incompletos." };
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    category,
    answer_text: null,
    answer_team_id: null,
    answer_player_id: null,
  };

  if (answerType === "team") {
    const teamId = formData.get("answer_team_id") as string;
    if (!teamId) return { error: "Debes seleccionar un equipo." };
    row.answer_team_id = parseInt(teamId, 10);
  } else if (answerType === "player") {
    const playerId = formData.get("answer_player_id") as string;
    if (!playerId) return { error: "Debes seleccionar un jugador." };
    row.answer_player_id = playerId;
  } else {
    const text = (formData.get("answer_text") as string)?.trim();
    if (!text) return { error: "Debes seleccionar una respuesta." };
    row.answer_text = text;
  }

  const { error } = await supabase
    .from("tournament_bets")
    .upsert(row, { onConflict: "user_id,category" });

  if (error) {
    if (error.code === "42501") {
      return { error: "Esta apuesta ya está cerrada." };
    }
    return { error: error.message };
  }

  revalidatePath("/apuestas");
  return { success: true };
}

export async function submitCustomBetAnswer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const customBetId = formData.get("custom_bet_id") as string;
  const betType = formData.get("bet_type") as string;

  if (!customBetId || !betType) {
    return { error: "Datos incompletos." };
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    custom_bet_id: customBetId,
    answer_text: null,
    answer_team_id: null,
    answer_player_id: null,
  };

  if (betType === "team") {
    const teamId = formData.get("answer_team_id") as string;
    if (!teamId) return { error: "Debes seleccionar un equipo." };
    row.answer_team_id = parseInt(teamId, 10);
  } else if (betType === "player") {
    const playerId = formData.get("answer_player_id") as string;
    if (!playerId) return { error: "Debes seleccionar un jugador." };
    row.answer_player_id = playerId;
  } else {
    const text = (formData.get("answer_text") as string)?.trim();
    if (!text) return { error: "Debes dar una respuesta." };
    row.answer_text = text;
  }

  const { error } = await supabase
    .from("custom_bet_answers")
    .upsert(row, { onConflict: "user_id,custom_bet_id" });

  if (error) {
    if (error.code === "42501") {
      return { error: "Esta apuesta ya está cerrada." };
    }
    return { error: error.message };
  }

  revalidatePath("/apuestas");
  return { success: true };
}