-- Groups (A through L)
INSERT INTO groups (name) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'),
  ('G'), ('H'), ('I'), ('J'), ('K'), ('L');

-- Teams (48 teams — using qualified/expected teams as of May 2026)
-- Group assignments are provisional and should be updated after the official draw
INSERT INTO teams (name, code, group_id) VALUES
  -- Group A
  ('Estados Unidos', 'USA', 1), ('Colombia', 'COL', 1), ('Marruecos', 'MAR', 1), ('Malí', 'MLI', 1),
  -- Group B
  ('México', 'MEX', 2), ('Ecuador', 'ECU', 2), ('Japón', 'JPN', 2), ('Escocia', 'SCO', 2),
  -- Group C
  ('Argentina', 'ARG', 3), ('Egipto', 'EGY', 3), ('Uzbekistán', 'UZB', 3), ('Guatemala', 'GUA', 3),
  -- Group D
  ('Francia', 'FRA', 4), ('Turquía', 'TUR', 4), ('China', 'CHN', 4), ('Indonesia', 'IDN', 4),
  -- Group E
  ('Brasil', 'BRA', 5), ('Australia', 'AUS', 5), ('Camerún', 'CMR', 5), ('Bahréin', 'BHR', 5),
  -- Group F
  ('Alemania', 'GER', 6), ('Uruguay', 'URU', 6), ('Panamá', 'PAN', 6), ('Nueva Zelanda', 'NZL', 6),
  -- Group G
  ('España', 'ESP', 7), ('Nigeria', 'NGA', 7), ('Bolivia', 'BOL', 7), ('Albania', 'ALB', 7),
  -- Group H
  ('Portugal', 'POR', 8), ('Irán', 'IRN', 8), ('Costa de Marfil', 'CIV', 8), ('Paraguay', 'PAR', 8),
  -- Group I
  ('Países Bajos', 'NED', 9), ('Senegal', 'SEN', 9), ('Jamaica', 'JAM', 9), ('Qatar', 'QAT', 9),
  -- Group J
  ('Inglaterra', 'ENG', 10), ('Chile', 'CHI', 10), ('Corea del Sur', 'KOR', 10), ('Arabia Saudita', 'KSA', 10),
  -- Group K
  ('Bélgica', 'BEL', 11), ('Perú', 'PER', 11), ('Canadá', 'CAN', 11), ('Serbia', 'SRB', 11),
  -- Group L
  ('Italia', 'ITA', 12), ('Croacia', 'CRO', 12), ('Venezuela', 'VEN', 12), ('Dinamarca', 'DEN', 12);

-- Tournament bet config
-- Lock date = tournament start (June 11, 2026 — update if needed)
INSERT INTO tournament_bet_config (category, label, points_value, lock_at) VALUES
  ('champion', 'Campeón', 10, '2026-06-11T00:00:00Z'),
  ('top_scorer', 'Máximo Goleador', 7, '2026-06-11T00:00:00Z'),
  ('golden_ball', 'Balón de Oro', 7, '2026-06-11T00:00:00Z'),
  ('surprise_team', 'Selección Revelación', 5, '2026-06-11T00:00:00Z'),
  ('most_goals_group_stage', 'Más Goles en Fase de Grupos', 5, '2026-06-11T00:00:00Z');

-- NOTE: Match fixtures should be inserted once FIFA publishes the official schedule.
-- Use the admin panel or a script to bulk-insert from football-data.org.
-- Example fixture format:
-- INSERT INTO matches (home_team_id, away_team_id, group_id, stage, kickoff_at, venue) VALUES
--   (1, 4, 1, 'group', '2026-06-11T18:00:00Z', 'SoFi Stadium, Los Angeles');
