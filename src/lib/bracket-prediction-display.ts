// Bracket predictions store the user's projected score keyed to the teams they
// projected into each slot (`predicted_home_team_id` / `predicted_away_team_id`).
// When showing that pick next to the *actual* match teams, the score may need to
// be flipped so it lines up with the real home/away slots. Points are the sum of
// the team and score components computed by the scoring functions.

export type BracketPredictionRow = {
  predicted_home_team_id: number;
  predicted_away_team_id: number;
  home_score: number;
  away_score: number;
  team_points_earned: number;
  score_points_earned: number;
};

export type MatchSlots = {
  home_team_id: number | null;
  away_team_id: number | null;
};

export type DisplayPrediction = {
  home_score: number;
  away_score: number;
  points_earned: number;
};

export function orientBracketPrediction(
  bp: BracketPredictionRow,
  match: MatchSlots
): DisplayPrediction {
  // Flip when the user's projected teams landed in the opposite slots from the
  // teams that actually reached this match.
  const flipped =
    bp.predicted_home_team_id === match.away_team_id ||
    bp.predicted_away_team_id === match.home_team_id;

  return {
    home_score: flipped ? bp.away_score : bp.home_score,
    away_score: flipped ? bp.home_score : bp.away_score,
    points_earned: bp.team_points_earned + bp.score_points_earned,
  };
}