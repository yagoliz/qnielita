"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitMatchPrediction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const matchId = parseInt(formData.get("match_id") as string, 10);
  const homeScore = parseInt(formData.get("home_score") as string, 10);
  const awayScore = parseInt(formData.get("away_score") as string, 10);

  if (isNaN(matchId) || isNaN(homeScore) || isNaN(awayScore)) {
    return { error: "Datos inválidos." };
  }

  if (homeScore < 0 || awayScore < 0) {
    return { error: "Los goles no pueden ser negativos." };
  }

  const { error } = await supabase
    .from("match_predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" }
    );

  if (error) {
    if (error.message.includes("rls") || error.code === "42501") {
      return { error: "El partido ya ha comenzado. No puedes cambiar tu predicción." };
    }
    return { error: error.message };
  }

  revalidatePath("/partidos");
  revalidatePath("/inicio");
  return { success: true };
}

const GROUP_STAGE_LOCK = new Date("2026-06-11T18:00:00Z");

export async function fillRandomGroupPredictions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  if (GROUP_STAGE_LOCK <= new Date()) {
    return { error: "La fase de grupos está cerrada." };
  }

  const { data: groupMatches, error: matchesError } = await supabase
    .from("matches")
    .select("id")
    .eq("stage", "group");

  if (matchesError) return { error: matchesError.message };

  const matchIds = (groupMatches ?? []).map((m) => (m as { id: number }).id);
  if (matchIds.length === 0) return { success: true, filled: 0 };

  const { data: existing, error: existingError } = await supabase
    .from("match_predictions")
    .select("match_id")
    .eq("user_id", user.id)
    .in("match_id", matchIds);

  if (existingError) return { error: existingError.message };

  const predicted = new Set(
    (existing ?? []).map((p) => (p as { match_id: number }).match_id)
  );
  const unfilled = matchIds.filter((id) => !predicted.has(id));

  if (unfilled.length === 0) return { success: true, filled: 0 };

  const now = new Date().toISOString();
  const rows = unfilled.map((matchId) => ({
    user_id: user.id,
    match_id: matchId,
    home_score: Math.floor(Math.random() * 4),
    away_score: Math.floor(Math.random() * 4),
    updated_at: now,
  }));

  const { error } = await supabase
    .from("match_predictions")
    .upsert(rows, { onConflict: "user_id,match_id" });

  if (error) {
    if (error.message.includes("rls") || error.code === "42501") {
      return { error: "La fase de grupos está cerrada." };
    }
    return { error: error.message };
  }

  revalidatePath("/partidos");
  revalidatePath("/inicio");
  return { success: true, filled: unfilled.length };
}
