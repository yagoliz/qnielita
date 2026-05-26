-- Groups (A through L)
INSERT INTO groups (name) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'),
  ('G'), ('H'), ('I'), ('J'), ('K'), ('L');

-- Teams (48 teams — official FIFA World Cup 2026 groups)
INSERT INTO teams (name, code, group_id) VALUES
  -- Group A
  ('México', 'MEX', 1), ('Corea del Sur', 'KOR', 1), ('Chequia', 'CZE', 1), ('Sudáfrica', 'RSA', 1),
  -- Group B
  ('Canadá', 'CAN', 2), ('Catar', 'QAT', 2), ('Suiza', 'SUI', 2), ('Bosnia y Herzegovina', 'BIH', 2),
  -- Group C
  ('Brasil', 'BRA', 3), ('Marruecos', 'MAR', 3), ('Haití', 'HAI', 3), ('Escocia', 'SCO', 3),
  -- Group D
  ('Estados Unidos', 'USA', 4), ('Australia', 'AUS', 4), ('Turquía', 'TUR', 4), ('Paraguay', 'PAR', 4),
  -- Group E
  ('Alemania', 'GER', 5), ('Costa de Marfil', 'CIV', 5), ('Ecuador', 'ECU', 5), ('Curazao', 'CUW', 5),
  -- Group F
  ('Países Bajos', 'NED', 6), ('Japón', 'JPN', 6), ('Suecia', 'SWE', 6), ('Túnez', 'TUN', 6),
  -- Group G
  ('Bélgica', 'BEL', 7), ('Egipto', 'EGY', 7), ('Irán', 'IRN', 7), ('Nueva Zelanda', 'NZL', 7),
  -- Group H
  ('España', 'ESP', 8), ('Arabia Saudita', 'KSA', 8), ('Uruguay', 'URU', 8), ('Cabo Verde', 'CPV', 8),
  -- Group I
  ('Francia', 'FRA', 9), ('Senegal', 'SEN', 9), ('Irak', 'IRQ', 9), ('Noruega', 'NOR', 9),
  -- Group J
  ('Argentina', 'ARG', 10), ('Argelia', 'ALG', 10), ('Austria', 'AUT', 10), ('Jordania', 'JOR', 10),
  -- Group K
  ('Portugal', 'POR', 11), ('Uzbekistán', 'UZB', 11), ('Colombia', 'COL', 11), ('R.D. del Congo', 'COD', 11),
  -- Group L
  ('Inglaterra', 'ENG', 12), ('Croacia', 'CRO', 12), ('Ghana', 'GHA', 12), ('Panamá', 'PAN', 12);

-- Tournament bet config
-- Lock date = tournament start (June 11, 2026)
INSERT INTO tournament_bet_config (category, label, points_value, lock_at) VALUES
  ('champion', 'Campeón', 10, '2026-06-11T00:00:00Z'),
  ('top_scorer', 'Máximo Goleador', 7, '2026-06-11T00:00:00Z'),
  ('golden_ball', 'Balón de Oro', 7, '2026-06-11T00:00:00Z'),
  ('surprise_team', 'Selección Revelación', 5, '2026-06-11T00:00:00Z'),
  ('most_goals_group_stage', 'Más Goles en Fase de Grupos', 5, '2026-06-11T00:00:00Z');

-- Group stage matches (72 matches)
-- Official FIFA World Cup 2026 schedule. All times UTC.
-- Per group: MD1 (1v4, 2v3), MD2 (3v4, 1v2), MD3 (3v1, 4v2)
INSERT INTO matches (home_team_id, away_team_id, group_id, stage, kickoff_at, venue) VALUES
  -- Group A: MEX(1), KOR(2), CZE(3), RSA(4)
  (1, 4, 1, 'group', '2026-06-11T19:00:00Z', 'Estadio Azteca, Ciudad de México'),
  (2, 3, 1, 'group', '2026-06-12T02:00:00Z', 'Estadio Akron, Guadalajara'),
  (3, 4, 1, 'group', '2026-06-18T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),
  (1, 2, 1, 'group', '2026-06-19T01:00:00Z', 'Estadio Akron, Guadalajara'),
  (3, 1, 1, 'group', '2026-06-25T01:00:00Z', 'Estadio Azteca, Ciudad de México'),
  (4, 2, 1, 'group', '2026-06-25T01:00:00Z', 'Estadio BBVA, Monterrey'),

  -- Group B: CAN(5), QAT(6), SUI(7), BIH(8)
  (5, 8, 2, 'group', '2026-06-12T19:00:00Z', 'BMO Field, Toronto'),
  (6, 7, 2, 'group', '2026-06-13T19:00:00Z', 'Levi''s Stadium, Santa Clara'),
  (7, 8, 2, 'group', '2026-06-18T19:00:00Z', 'SoFi Stadium, Los Ángeles'),
  (5, 6, 2, 'group', '2026-06-18T22:00:00Z', 'BC Place, Vancouver'),
  (7, 5, 2, 'group', '2026-06-24T19:00:00Z', 'BC Place, Vancouver'),
  (8, 6, 2, 'group', '2026-06-24T19:00:00Z', 'Lumen Field, Seattle'),

  -- Group C: BRA(9), MAR(10), HAI(11), SCO(12)
  (9, 12, 3, 'group', '2026-06-13T22:00:00Z', 'MetLife Stadium, Nueva Jersey'),
  (10, 11, 3, 'group', '2026-06-14T01:00:00Z', 'Gillette Stadium, Foxborough'),
  (11, 12, 3, 'group', '2026-06-19T22:00:00Z', 'Gillette Stadium, Foxborough'),
  (9, 10, 3, 'group', '2026-06-20T00:30:00Z', 'Lincoln Financial Field, Filadelfia'),
  (11, 9, 3, 'group', '2026-06-24T22:00:00Z', 'Hard Rock Stadium, Miami'),
  (12, 10, 3, 'group', '2026-06-24T22:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  -- Group D: USA(13), AUS(14), TUR(15), PAR(16)
  (13, 16, 4, 'group', '2026-06-13T01:00:00Z', 'SoFi Stadium, Los Ángeles'),
  (14, 15, 4, 'group', '2026-06-14T04:00:00Z', 'BC Place, Vancouver'),
  (15, 16, 4, 'group', '2026-06-19T19:00:00Z', 'Lumen Field, Seattle'),
  (13, 14, 4, 'group', '2026-06-20T04:00:00Z', 'Levi''s Stadium, Santa Clara'),
  (15, 13, 4, 'group', '2026-06-26T02:00:00Z', 'SoFi Stadium, Los Ángeles'),
  (16, 14, 4, 'group', '2026-06-26T02:00:00Z', 'Levi''s Stadium, Santa Clara'),

  -- Group E: GER(17), CIV(18), ECU(19), CUW(20)
  (17, 20, 5, 'group', '2026-06-14T17:00:00Z', 'NRG Stadium, Houston'),
  (18, 19, 5, 'group', '2026-06-14T23:00:00Z', 'Lincoln Financial Field, Filadelfia'),
  (19, 20, 5, 'group', '2026-06-20T20:00:00Z', 'BMO Field, Toronto'),
  (17, 18, 5, 'group', '2026-06-21T00:00:00Z', 'Arrowhead Stadium, Kansas City'),
  (19, 17, 5, 'group', '2026-06-25T20:00:00Z', 'MetLife Stadium, Nueva Jersey'),
  (20, 18, 5, 'group', '2026-06-25T20:00:00Z', 'Lincoln Financial Field, Filadelfia'),

  -- Group F: NED(21), JPN(22), SWE(23), TUN(24)
  (21, 24, 6, 'group', '2026-06-14T20:00:00Z', 'AT&T Stadium, Dallas'),
  (22, 23, 6, 'group', '2026-06-15T02:00:00Z', 'Estadio BBVA, Monterrey'),
  (23, 24, 6, 'group', '2026-06-20T17:00:00Z', 'NRG Stadium, Houston'),
  (21, 22, 6, 'group', '2026-06-21T04:00:00Z', 'Estadio BBVA, Monterrey'),
  (23, 21, 6, 'group', '2026-06-25T23:00:00Z', 'AT&T Stadium, Dallas'),
  (24, 22, 6, 'group', '2026-06-25T23:00:00Z', 'Arrowhead Stadium, Kansas City'),

  -- Group G: BEL(25), EGY(26), IRN(27), NZL(28)
  (25, 28, 7, 'group', '2026-06-15T19:00:00Z', 'Lumen Field, Seattle'),
  (26, 27, 7, 'group', '2026-06-16T01:00:00Z', 'SoFi Stadium, Los Ángeles'),
  (27, 28, 7, 'group', '2026-06-21T19:00:00Z', 'SoFi Stadium, Los Ángeles'),
  (25, 26, 7, 'group', '2026-06-22T01:00:00Z', 'BC Place, Vancouver'),
  (27, 25, 7, 'group', '2026-06-27T03:00:00Z', 'Lumen Field, Seattle'),
  (28, 26, 7, 'group', '2026-06-27T03:00:00Z', 'BC Place, Vancouver'),

  -- Group H: ESP(29), KSA(30), URU(31), CPV(32)
  (29, 32, 8, 'group', '2026-06-15T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),
  (30, 31, 8, 'group', '2026-06-15T22:00:00Z', 'Hard Rock Stadium, Miami'),
  (31, 32, 8, 'group', '2026-06-21T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),
  (29, 30, 8, 'group', '2026-06-21T22:00:00Z', 'Hard Rock Stadium, Miami'),
  (31, 29, 8, 'group', '2026-06-27T00:00:00Z', 'NRG Stadium, Houston'),
  (32, 30, 8, 'group', '2026-06-27T00:00:00Z', 'Estadio Akron, Guadalajara'),

  -- Group I: FRA(33), SEN(34), IRQ(35), NOR(36)
  (33, 36, 9, 'group', '2026-06-16T19:00:00Z', 'MetLife Stadium, Nueva Jersey'),
  (34, 35, 9, 'group', '2026-06-16T22:00:00Z', 'Gillette Stadium, Foxborough'),
  (35, 36, 9, 'group', '2026-06-22T21:00:00Z', 'Lincoln Financial Field, Filadelfia'),
  (33, 34, 9, 'group', '2026-06-23T00:00:00Z', 'MetLife Stadium, Nueva Jersey'),
  (35, 33, 9, 'group', '2026-06-26T19:00:00Z', 'Gillette Stadium, Foxborough'),
  (36, 34, 9, 'group', '2026-06-26T19:00:00Z', 'BMO Field, Toronto'),

  -- Group J: ARG(37), ALG(38), AUT(39), JOR(40)
  (37, 40, 10, 'group', '2026-06-17T01:00:00Z', 'Arrowhead Stadium, Kansas City'),
  (38, 39, 10, 'group', '2026-06-17T04:00:00Z', 'Levi''s Stadium, Santa Clara'),
  (39, 40, 10, 'group', '2026-06-22T17:00:00Z', 'AT&T Stadium, Dallas'),
  (37, 38, 10, 'group', '2026-06-23T03:00:00Z', 'Levi''s Stadium, Santa Clara'),
  (39, 37, 10, 'group', '2026-06-28T02:00:00Z', 'Arrowhead Stadium, Kansas City'),
  (40, 38, 10, 'group', '2026-06-28T02:00:00Z', 'AT&T Stadium, Dallas'),

  -- Group K: POR(41), UZB(42), COL(43), COD(44)
  (41, 44, 11, 'group', '2026-06-17T17:00:00Z', 'NRG Stadium, Houston'),
  (42, 43, 11, 'group', '2026-06-18T02:00:00Z', 'Estadio Azteca, Ciudad de México'),
  (43, 44, 11, 'group', '2026-06-23T17:00:00Z', 'NRG Stadium, Houston'),
  (41, 42, 11, 'group', '2026-06-24T02:00:00Z', 'Estadio Akron, Guadalajara'),
  (43, 41, 11, 'group', '2026-06-27T23:30:00Z', 'Hard Rock Stadium, Miami'),
  (44, 42, 11, 'group', '2026-06-27T23:30:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  -- Group L: ENG(45), CRO(46), GHA(47), PAN(48)
  (45, 48, 12, 'group', '2026-06-17T20:00:00Z', 'AT&T Stadium, Dallas'),
  (46, 47, 12, 'group', '2026-06-17T23:00:00Z', 'BMO Field, Toronto'),
  (47, 48, 12, 'group', '2026-06-23T20:00:00Z', 'Gillette Stadium, Foxborough'),
  (45, 46, 12, 'group', '2026-06-23T23:00:00Z', 'BMO Field, Toronto'),
  (47, 45, 12, 'group', '2026-06-27T21:00:00Z', 'MetLife Stadium, Nueva Jersey'),
  (48, 46, 12, 'group', '2026-06-27T21:00:00Z', 'Lincoln Financial Field, Filadelfia');
