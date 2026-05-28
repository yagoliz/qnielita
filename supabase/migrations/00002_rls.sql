-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_bet_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_bet_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Profiles: anyone can read"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Profiles: users can update own"
  ON profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INVITES
CREATE POLICY "Invites: admin can create"
  ON invites FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Invites: anyone can read unused invites by token"
  ON invites FOR SELECT USING (true);

-- INVITE CLAIMS
CREATE POLICY "invite_claims: admin can read"
  ON invite_claims FOR SELECT USING (is_admin());

-- GROUPS / TEAMS / MATCHES / MATCH_RESULTS / TOURNAMENT_BET_CONFIG — public read
CREATE POLICY "Groups: anyone can read"
  ON groups FOR SELECT USING (true);

CREATE POLICY "Teams: anyone can read"
  ON teams FOR SELECT USING (true);

CREATE POLICY "Players: anyone can read"
  ON players FOR SELECT USING (true);

CREATE POLICY "Matches: anyone can read"
  ON matches FOR SELECT USING (true);

CREATE POLICY "Matches: admin can update"
  ON matches FOR UPDATE USING (is_admin());

CREATE POLICY "Match results: anyone can read"
  ON match_results FOR SELECT USING (true);

CREATE POLICY "Match results: admin can insert"
  ON match_results FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Match results: admin can update"
  ON match_results FOR UPDATE USING (is_admin());

CREATE POLICY "Tournament bet config: anyone can read"
  ON tournament_bet_config FOR SELECT USING (true);

CREATE POLICY "Tournament bet config: admin can update"
  ON tournament_bet_config FOR UPDATE USING (is_admin());

-- MATCH PREDICTIONS
CREATE POLICY "Match predictions: users can read own"
  ON match_predictions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Match predictions: users can insert own before kickoff"
  ON match_predictions FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM matches WHERE id = match_id AND kickoff_at > now()
    )
  );

CREATE POLICY "Match predictions: users can update own before kickoff"
  ON match_predictions FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM matches WHERE id = match_id AND kickoff_at > now()
    )
  );

CREATE POLICY "Match predictions: anyone can read after result"
  ON match_predictions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM match_results WHERE match_id = match_predictions.match_id
    )
  );

-- TOURNAMENT BETS
CREATE POLICY "Tournament bets: users can read own"
  ON tournament_bets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tournament bets: users can insert own before lock"
  ON tournament_bets FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tournament_bet_config
      WHERE category = tournament_bets.category AND lock_at > now()
    )
  );

CREATE POLICY "Tournament bets: users can update own before lock"
  ON tournament_bets FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tournament_bet_config
      WHERE category = tournament_bets.category AND lock_at > now()
    )
  );

CREATE POLICY "Tournament bets: anyone can read after lock"
  ON tournament_bets FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournament_bet_config
      WHERE category = tournament_bets.category AND lock_at <= now()
    )
  );

-- CUSTOM BETS
CREATE POLICY "Custom bets: anyone can read"
  ON custom_bets FOR SELECT USING (true);

CREATE POLICY "Custom bets: admin can insert"
  ON custom_bets FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Custom bets: admin can update"
  ON custom_bets FOR UPDATE USING (is_admin());

-- CUSTOM BET ANSWERS
CREATE POLICY "Custom bet answers: users can read own"
  ON custom_bet_answers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Custom bet answers: users can insert own before lock"
  ON custom_bet_answers FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM custom_bets
      WHERE id = custom_bet_id AND lock_at > now()
    )
  );

CREATE POLICY "Custom bet answers: users can update own before lock"
  ON custom_bet_answers FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM custom_bets
      WHERE id = custom_bet_id AND lock_at > now()
    )
  );

CREATE POLICY "Custom bet answers: anyone can read after resolution"
  ON custom_bet_answers FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM custom_bets
      WHERE id = custom_bet_id
        AND (correct_answer_text IS NOT NULL
          OR correct_answer_team_id IS NOT NULL
          OR correct_answer_player_id IS NOT NULL)
    )
  );

-- LEADERBOARD
CREATE POLICY "Leaderboard: anyone can read"
  ON leaderboard FOR SELECT USING (true);

-- BRACKET
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