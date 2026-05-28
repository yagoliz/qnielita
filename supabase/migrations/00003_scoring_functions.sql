-- Calculate points for a single match prediction
CREATE OR REPLACE FUNCTION calculate_match_points(
  p_home INTEGER, p_away INTEGER,
  a_home INTEGER, a_away INTEGER
) RETURNS INTEGER AS $$
BEGIN
  -- Exact score
  IF p_home = a_home AND p_away = a_away THEN
    RETURN 5;
  END IF;

  -- Correct goal difference
  IF (p_home - p_away) = (a_home - a_away) THEN
    RETURN 3;
  END IF;

  -- Correct winner/draw
  IF sign(p_home - p_away) = sign(a_home - a_away) THEN
    RETURN 2;
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recalculate scores for all predictions of a given match
CREATE OR REPLACE FUNCTION recalculate_match_scores(p_match_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE match_predictions mp
  SET points_earned = calculate_match_points(
    mp.home_score, mp.away_score,
    mr.home_score, mr.away_score
  )
  FROM match_results mr
  WHERE mr.match_id = p_match_id
    AND mp.match_id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate tournament bet scores for a given category
CREATE OR REPLACE FUNCTION recalculate_tournament_scores(p_category tournament_bet_category)
RETURNS VOID AS $$
BEGIN
  UPDATE tournament_bets tb
  SET points_earned = CASE
    WHEN lower(trim(tb.answer)) = lower(trim(tbc.correct_answer)) THEN tbc.points_value
    ELSE 0
  END
  FROM tournament_bet_config tbc
  WHERE tbc.category = p_category
    AND tb.category = p_category
    AND tbc.correct_answer IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate custom bet scores for a given bet
CREATE OR REPLACE FUNCTION recalculate_custom_bet_scores(p_bet_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE custom_bet_answers cba
  SET points_earned = CASE
    WHEN lower(trim(cba.answer)) = lower(trim(cb.correct_answer)) THEN cb.points_value
    ELSE 0
  END
  FROM custom_bets cb
  WHERE cb.id = p_bet_id
    AND cba.custom_bet_id = p_bet_id
    AND cb.correct_answer IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bracket scoring: points for correctly predicting teams in a match
CREATE OR REPLACE FUNCTION calculate_bracket_team_points(
  p_stage match_stage,
  p_pred_home INTEGER,
  p_pred_away INTEGER,
  a_actual_home INTEGER,
  a_actual_away INTEGER
) RETURNS INTEGER AS $$
DECLARE
  pts_per_team INTEGER;
  total INTEGER := 0;
BEGIN
  IF p_stage = 'R32' THEN RETURN 0; END IF;

  SELECT CASE p_stage
    WHEN 'R16' THEN team_points_r16
    WHEN 'QF' THEN team_points_qf
    WHEN 'SF' THEN team_points_sf
    WHEN 'third_place' THEN team_points_third
    WHEN 'final' THEN team_points_final
    ELSE 0
  END INTO pts_per_team
  FROM bracket_config LIMIT 1;

  IF p_pred_home = a_actual_home OR p_pred_home = a_actual_away THEN
    total := total + pts_per_team;
  END IF;
  IF p_pred_away = a_actual_home OR p_pred_away = a_actual_away THEN
    total := total + pts_per_team;
  END IF;

  RETURN total;
END;
$$ LANGUAGE plpgsql STABLE;

-- Recalculate bracket scores for a given match
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
    score_points_earned = CASE
      WHEN v_stage = 'R32' THEN
        calculate_match_points(bp.home_score, bp.away_score, v_result_home, v_result_away)
      WHEN (bp.predicted_home_team_id = v_actual_home OR bp.predicted_home_team_id = v_actual_away)
        AND (bp.predicted_away_team_id = v_actual_home OR bp.predicted_away_team_id = v_actual_away)
      THEN
        calculate_match_points(bp.home_score, bp.away_score, v_result_home, v_result_away)
      ELSE 0
    END
  WHERE bp.match_id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebuild the entire leaderboard
CREATE OR REPLACE FUNCTION recalculate_leaderboard()
RETURNS VOID AS $$
BEGIN
  DELETE FROM leaderboard WHERE TRUE;

  INSERT INTO leaderboard (user_id, display_name, match_points, tournament_points, custom_points, bracket_points, total_points, rank)
  SELECT
    p.id,
    p.display_name,
    COALESCE(mp.pts, 0),
    COALESCE(tb.pts, 0),
    COALESCE(cb.pts, 0),
    COALESCE(bp.pts, 0),
    COALESCE(mp.pts, 0) + COALESCE(tb.pts, 0) + COALESCE(cb.pts, 0) + COALESCE(bp.pts, 0),
    0
  FROM profiles p
  LEFT JOIN (
    SELECT user_id, SUM(COALESCE(points_earned, 0)) AS pts
    FROM match_predictions
    GROUP BY user_id
  ) mp ON mp.user_id = p.id
  LEFT JOIN (
    SELECT user_id, SUM(COALESCE(points_earned, 0)) AS pts
    FROM tournament_bets
    GROUP BY user_id
  ) tb ON tb.user_id = p.id
  LEFT JOIN (
    SELECT user_id, SUM(COALESCE(points_earned, 0)) AS pts
    FROM custom_bet_answers
    GROUP BY user_id
  ) cb ON cb.user_id = p.id
  LEFT JOIN (
    SELECT user_id, SUM(COALESCE(team_points_earned, 0) + COALESCE(score_points_earned, 0)) AS pts
    FROM bracket_predictions
    GROUP BY user_id
  ) bp ON bp.user_id = p.id;

  UPDATE leaderboard l
  SET rank = sub.rank
  FROM (
    SELECT user_id, DENSE_RANK() OVER (ORDER BY total_points DESC) AS rank
    FROM leaderboard
  ) sub
  WHERE l.user_id = sub.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: recalculate scores when match result is inserted or updated
CREATE OR REPLACE FUNCTION on_match_result_change()
RETURNS TRIGGER AS $$
DECLARE
  v_stage match_stage;
BEGIN
  PERFORM recalculate_match_scores(NEW.match_id);

  SELECT stage INTO v_stage FROM matches WHERE id = NEW.match_id;
  IF v_stage != 'group' THEN
    PERFORM recalculate_bracket_scores(NEW.match_id);
  END IF;

  PERFORM recalculate_leaderboard();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_match_result_change
  AFTER INSERT OR UPDATE ON match_results
  FOR EACH ROW EXECUTE FUNCTION on_match_result_change();