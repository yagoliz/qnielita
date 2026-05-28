"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type BracketPrediction = {
  match_id: number;
  predicted_home_team_id: number;
  predicted_away_team_id: number;
  home_score: number;
  away_score: number;
  penalty_winner: "home" | "away" | null;
};

export async function submitSingleBracketMatch(prediction: BracketPrediction) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  if (prediction.home_score < 0 || prediction.away_score < 0) {
    return { error: "Los goles no pueden ser negativos." };
  }
  if (prediction.home_score === prediction.away_score && !prediction.penalty_winner) {
    return { error: "Debes indicar ganador en penales si hay empate." };
  }

  const { error } = await supabase
    .from("bracket_predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: prediction.match_id,
        predicted_home_team_id: prediction.predicted_home_team_id,
        predicted_away_team_id: prediction.predicted_away_team_id,
        home_score: prediction.home_score,
        away_score: prediction.away_score,
        penalty_winner:
          prediction.home_score === prediction.away_score
            ? prediction.penalty_winner
            : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" }
    );

  if (error) {
    if (error.message.includes("rls") || error.code === "42501") {
      return { error: "Las predicciones de eliminatorias no están abiertas en este momento." };
    }
    return { error: error.message };
  }

  revalidatePath("/partidos");
  revalidatePath("/inicio");
  return { success: true };
}

export async function submitBracket(predictions: BracketPrediction[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  if (predictions.length === 0) {
    return { error: "No hay predicciones." };
  }

  for (const p of predictions) {
    if (p.home_score < 0 || p.away_score < 0) {
      return { error: "Los goles no pueden ser negativos." };
    }
    if (p.home_score === p.away_score && !p.penalty_winner) {
      return { error: `Partido ${p.match_id}: debes indicar ganador en penales si hay empate.` };
    }
  }

  const rows = predictions.map((p) => ({
    user_id: user.id,
    match_id: p.match_id,
    predicted_home_team_id: p.predicted_home_team_id,
    predicted_away_team_id: p.predicted_away_team_id,
    home_score: p.home_score,
    away_score: p.away_score,
    penalty_winner: p.home_score === p.away_score ? p.penalty_winner : null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("bracket_predictions")
    .upsert(rows, { onConflict: "user_id,match_id" });

  if (error) {
    if (error.message.includes("rls") || error.code === "42501") {
      return { error: "Las predicciones de eliminatorias no están abiertas en este momento." };
    }
    return { error: error.message };
  }

  revalidatePath("/partidos");
  revalidatePath("/inicio");
  return { success: true };
}
