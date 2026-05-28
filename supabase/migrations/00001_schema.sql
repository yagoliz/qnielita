-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Enums
CREATE TYPE match_stage AS ENUM (
  'group', 'R32', 'R16', 'QF', 'SF', 'third_place', 'final'
);

CREATE TYPE bet_type AS ENUM ('yes_no', 'multiple_choice', 'open_text');

CREATE TYPE tournament_bet_category AS ENUM (
  'champion', 'top_scorer', 'golden_ball', 'surprise_team', 'most_goals_group_stage'
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '⚽',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invites
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  created_by UUID NOT NULL REFERENCES profiles(id),
  used_by UUID REFERENCES profiles(id),
  allowed_emails TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invite claims (tracks multi-use invites)
CREATE TABLE invite_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(invite_id, user_id)
);

-- Groups
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL  -- 'A' through 'L'
);

-- Teams
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,  -- 3-letter code like 'ESP', 'ARG'
  flag_url TEXT,
  group_id INTEGER NOT NULL REFERENCES groups(id)
);

-- Matches
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  group_id INTEGER REFERENCES groups(id),
  stage match_stage NOT NULL,
  kickoff_at TIMESTAMPTZ NOT NULL,
  venue TEXT
);

CREATE INDEX idx_matches_kickoff ON matches(kickoff_at);
CREATE INDEX idx_matches_stage ON matches(stage);

-- Match Results
CREATE TABLE match_results (
  match_id INTEGER PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  penalty_winner TEXT CHECK (penalty_winner IN ('home', 'away')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Match Predictions
CREATE TABLE match_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  points_earned INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX idx_match_predictions_user ON match_predictions(user_id);
CREATE INDEX idx_match_predictions_match ON match_predictions(match_id);

-- Tournament Bet Config
CREATE TABLE tournament_bet_config (
  category tournament_bet_category PRIMARY KEY,
  label TEXT NOT NULL,           -- Spanish display name
  points_value INTEGER NOT NULL,
  lock_at TIMESTAMPTZ NOT NULL,
  correct_answer TEXT            -- filled after tournament
);

-- Tournament Bets
CREATE TABLE tournament_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category tournament_bet_category NOT NULL REFERENCES tournament_bet_config(category),
  answer TEXT NOT NULL,
  points_earned INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Custom Bets
CREATE TABLE custom_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  bet_type bet_type NOT NULL,
  options JSONB,                 -- for multiple_choice: ["option1", "option2", ...]
  points_value INTEGER NOT NULL DEFAULT 3,
  lock_at TIMESTAMPTZ NOT NULL,
  correct_answer TEXT,           -- filled when resolved
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom Bet Answers
CREATE TABLE custom_bet_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  custom_bet_id UUID NOT NULL REFERENCES custom_bets(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  points_earned INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, custom_bet_id)
);

-- Leaderboard (cached table)
CREATE TABLE leaderboard (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  match_points INTEGER NOT NULL DEFAULT 0,
  tournament_points INTEGER NOT NULL DEFAULT 0,
  custom_points INTEGER NOT NULL DEFAULT 0,
  bracket_points INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0
);

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

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();