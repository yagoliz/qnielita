-- Supabase's `authenticator` role preloads the `safeupdate` library, which
-- blocks DELETE/UPDATE without a WHERE clause even inside SECURITY DEFINER
-- functions. Replace the bare DELETE with `WHERE TRUE` so leaderboard rebuilds
-- triggered from server actions don't fail.
CREATE OR REPLACE FUNCTION recalculate_leaderboard()
RETURNS VOID AS $$
BEGIN
  DELETE FROM leaderboard WHERE TRUE;

  INSERT INTO leaderboard (user_id, display_name, match_points, tournament_points, custom_points, total_points, rank)
  SELECT
    p.id,
    p.display_name,
    COALESCE(mp.pts, 0),
    COALESCE(tb.pts, 0),
    COALESCE(cb.pts, 0),
    COALESCE(mp.pts, 0) + COALESCE(tb.pts, 0) + COALESCE(cb.pts, 0),
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
  ) cb ON cb.user_id = p.id;

  UPDATE leaderboard l
  SET rank = sub.rank
  FROM (
    SELECT user_id, DENSE_RANK() OVER (ORDER BY total_points DESC) AS rank
    FROM leaderboard
  ) sub
  WHERE l.user_id = sub.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
