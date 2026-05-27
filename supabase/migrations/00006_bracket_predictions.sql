-- Bracket configuration (single row)
CREATE TABLE bracket_config (
  id SERIAL PRIMARY KEY,
  unlock_at TIMESTAMPTZ NOT NULL,
  lock_at TIMESTAMPTZ NOT NULL,
  team_points_r16 INTEGER NOT NULL DEFAULT 2,
  team_points_qf INTEGER NOT NULL DEFAULT 4,
  team_points_sf INTEGER NOT NULL DEFAULT 6,
  team_points_third INTEGER NOT NULL DEFAULT 6,
  team_points_final INTEGER NOT NULL DEFAULT 8
);

INSERT INTO bracket_config (unlock_at, lock_at) VALUES
  ('2026-06-28T04:00:00Z', '2026-06-28T18:00:00Z');

-- Bracket predictions
CREATE TABLE bracket_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home_team_id INTEGER NOT NULL REFERENCES teams(id),
  predicted_away_team_id INTEGER NOT NULL REFERENCES teams(id),
  home_score INTEGER NOT NULL CHECK (home_score >= 0),
  away_score INTEGER NOT NULL CHECK (away_score >= 0),
  penalty_winner TEXT CHECK (penalty_winner IN ('home', 'away')),
  team_points_earned INTEGER NOT NULL DEFAULT 0,
  score_points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id),
  CONSTRAINT knockout_tie_needs_penalty CHECK (
    home_score != away_score OR penalty_winner IS NOT NULL
  )
);

CREATE INDEX idx_bracket_predictions_user ON bracket_predictions(user_id);
CREATE INDEX idx_bracket_predictions_match ON bracket_predictions(match_id);

-- RLS
ALTER TABLE bracket_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bracket config: anyone can read"
  ON bracket_config FOR SELECT USING (true);

CREATE POLICY "Bracket config: admin can update"
  ON bracket_config FOR UPDATE USING (is_admin());

CREATE POLICY "Bracket predictions: users can read own"
  ON bracket_predictions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Bracket predictions: users can insert in window"
  ON bracket_predictions FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM bracket_config WHERE unlock_at <= now() AND lock_at > now())
  );

CREATE POLICY "Bracket predictions: users can update in window"
  ON bracket_predictions FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM bracket_config WHERE unlock_at <= now() AND lock_at > now())
  );

CREATE POLICY "Bracket predictions: anyone can read after lock"
  ON bracket_predictions FOR SELECT USING (
    EXISTS (SELECT 1 FROM bracket_config WHERE lock_at <= now())
  );

-- Admin can manage matches (assign teams to knockout matches)
CREATE POLICY "Matches: admin can update"
  ON matches FOR UPDATE USING (is_admin());

-- Add bracket_points to leaderboard
ALTER TABLE leaderboard ADD COLUMN bracket_points INTEGER NOT NULL DEFAULT 0;

-- Bracket scoring function
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

-- Update the result-change trigger to also score bracket predictions
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

-- Update leaderboard to include bracket_points
CREATE OR REPLACE FUNCTION recalculate_leaderboard()
RETURNS VOID AS $$
BEGIN
  DELETE FROM leaderboard;

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
