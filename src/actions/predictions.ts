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
