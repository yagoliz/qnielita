"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitTournamentBet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const category = formData.get("category") as string;
  const answer = (formData.get("answer") as string)?.trim();

  if (!category || !answer) {
    return { error: "Debes seleccionar una respuesta." };
  }

  const { error } = await supabase
    .from("tournament_bets")
    .upsert(
      { user_id: user.id, category, answer },
      { onConflict: "user_id,category" }
    );

  if (error) {
    if (error.code === "42501") {
      return { error: "Esta apuesta ya está cerrada." };
    }
    return { error: error.message };
  }

  return { success: true };
}

export async function submitCustomBetAnswer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const customBetId = formData.get("custom_bet_id") as string;
  const answer = (formData.get("answer") as string)?.trim();

  if (!customBetId || !answer) {
    return { error: "Debes dar una respuesta." };
  }

  const { error } = await supabase
    .from("custom_bet_answers")
    .upsert(
      { user_id: user.id, custom_bet_id: customBetId, answer },
      { onConflict: "user_id,custom_bet_id" }
    );

  if (error) {
    if (error.code === "42501") {
      return { error: "Esta apuesta ya está cerrada." };
    }
    return { error: error.message };
  }

  return { success: true };
}
