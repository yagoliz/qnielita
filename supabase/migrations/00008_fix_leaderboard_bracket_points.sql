-- Fix recalculate_leaderboard() to include bracket_points, which was
-- accidentally dropped when 00007 rewrote the function for safeupdate.
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
