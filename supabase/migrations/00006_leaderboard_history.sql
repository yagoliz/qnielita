CREATE TABLE leaderboard_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  match_points INTEGER NOT NULL DEFAULT 0,
  tournament_points INTEGER NOT NULL DEFAULT 0,
  custom_points INTEGER NOT NULL DEFAULT 0,
  bracket_points INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leaderboard_history_snapshot_at
  ON leaderboard_history(snapshot_at);

CREATE INDEX idx_leaderboard_history_user_snapshot
  ON leaderboard_history(user_id, snapshot_at);

ALTER TABLE leaderboard_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard history: anyone can read"
  ON leaderboard_history FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION recalculate_leaderboard()
RETURNS VOID AS $$
DECLARE
  v_snapshot_at TIMESTAMPTZ := now();
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

  INSERT INTO leaderboard_history (
    user_id,
    display_name,
    match_points,
    tournament_points,
    custom_points,
    bracket_points,
    total_points,
    rank,
    snapshot_at
  )
  SELECT
    user_id,
    display_name,
    match_points,
    tournament_points,
    custom_points,
    bracket_points,
    total_points,
    rank,
    v_snapshot_at
  FROM leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;