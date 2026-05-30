-- Partial score credit for knockout bracket predictions (R16+).
--
-- Previously score points were awarded only when BOTH predicted teams appeared
-- in the actual match. Now, if at least one predicted team appears, we anchor on
-- that team, reorient both scorelines from its side (slot-agnostic), grade with
-- the normal 5/3/2/0 ladder, and halve the result (rounded down) when only one of
-- the two predicted teams matched. Both teams matching still earns full points.
--
-- R32 is unchanged (fixtures are seeded from groups, so no team gate).

CREATE OR REPLACE FUNCTION calculate_bracket_score_points(
  p_stage match_stage,
  p_pred_home_team INTEGER, p_pred_away_team INTEGER,
  p_pred_home_score INTEGER, p_pred_away_score INTEGER,
  a_home_team INTEGER, a_away_team INTEGER,
  a_home_score INTEGER, a_away_score INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_home_match BOOLEAN;
  v_away_match BOOLEAN;
  v_anchor INTEGER;
  v_pred_for INTEGER;
  v_pred_against INTEGER;
  v_actual_for INTEGER;
  v_actual_against INTEGER;
  v_raw INTEGER;
BEGIN
  IF p_stage = 'R32' THEN
    RETURN calculate_match_points(p_pred_home_score, p_pred_away_score, a_home_score, a_away_score);
  END IF;

  v_home_match := (p_pred_home_team = a_home_team OR p_pred_home_team = a_away_team);
  v_away_match := (p_pred_away_team = a_home_team OR p_pred_away_team = a_away_team);

  IF NOT v_home_match AND NOT v_away_match THEN
    RETURN 0;
  END IF;

  -- Anchor on a matched predicted team; reorient the predicted scoreline from its side.
  IF v_home_match THEN
    v_anchor := p_pred_home_team;
    v_pred_for := p_pred_home_score;
    v_pred_against := p_pred_away_score;
  ELSE
    v_anchor := p_pred_away_team;
    v_pred_for := p_pred_away_score;
    v_pred_against := p_pred_home_score;
  END IF;

  -- Reorient the actual scoreline from the same team's side.
  IF v_anchor = a_home_team THEN
    v_actual_for := a_home_score;
    v_actual_against := a_away_score;
  ELSE
    v_actual_for := a_away_score;
    v_actual_against := a_home_score;
  END IF;

  v_raw := calculate_match_points(v_pred_for, v_pred_against, v_actual_for, v_actual_against);

  IF v_home_match AND v_away_match THEN
    RETURN v_raw;
  ELSE
    RETURN v_raw / 2;  -- integer division floors (v_raw >= 0)
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Recalculate bracket scores for a given match, using the partial-credit score rule.
CREATE OR REPLACE FUNCTION recalculate_bracket_scores(p_match_id INTEGER)
RETURNS VOID AS $$
DECLARE
  v_stage match_stage;
  v_actual_home INTEGER;
  v_actual_away INTEGER;
  v_result_home INTEGER;
  v_result_away INTEGER;
BEGIN
  SELECT m.stage, m.home_team_id, m.away_team_id, mr.home_score, mr.away_score
  INTO v_stage, v_actual_home, v_actual_away, v_result_home, v_result_away
  FROM matches m
  JOIN match_results mr ON mr.match_id = m.id
  WHERE m.id = p_match_id;

  IF NOT FOUND THEN RETURN; END IF;

  UPDATE bracket_predictions bp
  SET
    team_points_earned = calculate_bracket_team_points(
      v_stage, bp.predicted_home_team_id, bp.predicted_away_team_id,
      v_actual_home, v_actual_away
    ),
    score_points_earned = calculate_bracket_score_points(
      v_stage,
      bp.predicted_home_team_id, bp.predicted_away_team_id,
      bp.home_score, bp.away_score,
      v_actual_home, v_actual_away,
      v_result_home, v_result_away
    )
  WHERE bp.match_id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;