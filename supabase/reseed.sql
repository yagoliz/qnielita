-- Re-applies seed.sql against an existing DB without touching auth, RLS, or migrations.
-- CASCADE will also wipe predictions / results / tournament_bets that FK into these tables.
-- Safe only while no user has placed predictions yet.

BEGIN;

TRUNCATE
  matches,
  teams,
  groups,
  tournament_bet_config
  RESTART IDENTITY CASCADE;

\i seed.sql

COMMIT;
