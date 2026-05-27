-- Drop API-related columns
ALTER TABLE match_results DROP COLUMN source;
ALTER TABLE matches DROP COLUMN external_id;
DROP TYPE result_source;

-- Add penalty winner for knockout draws (nullable — only set when knockout match is tied)
ALTER TABLE match_results ADD COLUMN penalty_winner TEXT CHECK (penalty_winner IN ('home', 'away'));