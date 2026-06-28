import { describe, it, expect } from "vitest";
import { orientBracketPrediction } from "../bracket-prediction-display";

const base = {
  predicted_home_team_id: 1,
  predicted_away_team_id: 2,
  home_score: 2,
  away_score: 1,
  team_points_earned: 4,
  score_points_earned: 3,
};

describe("orientBracketPrediction", () => {
  it("keeps the score as-is when projected teams match the actual slots", () => {
    expect(
      orientBracketPrediction(base, { home_team_id: 1, away_team_id: 2 })
    ).toEqual({ home_score: 2, away_score: 1, points_earned: 7 });
  });

  it("flips the score when projected teams landed in the opposite slots", () => {
    expect(
      orientBracketPrediction(base, { home_team_id: 2, away_team_id: 1 })
    ).toEqual({ home_score: 1, away_score: 2, points_earned: 7 });
  });

  it("flips when only the away team matches the actual home slot", () => {
    expect(
      orientBracketPrediction(base, { home_team_id: 2, away_team_id: 9 })
    ).toEqual({ home_score: 1, away_score: 2, points_earned: 7 });
  });

  it("leaves the score as-is when neither projected team reached the match", () => {
    expect(
      orientBracketPrediction(base, { home_team_id: 7, away_team_id: 8 })
    ).toEqual({ home_score: 2, away_score: 1, points_earned: 7 });
  });

  it("sums team and score points", () => {
    expect(
      orientBracketPrediction(
        { ...base, team_points_earned: 0, score_points_earned: 0 },
        { home_team_id: 1, away_team_id: 2 }
      ).points_earned
    ).toBe(0);
  });
});