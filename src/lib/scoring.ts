export function calculateMatchPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 5;
  }

  const predictedDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;

  if (predictedDiff === actualDiff) {
    return 3;
  }

  const predictedOutcome = Math.sign(predictedDiff);
  const actualOutcome = Math.sign(actualDiff);

  if (predictedOutcome === actualOutcome) {
    return 2;
  }

  return 0;
}

export type BracketConfig = {
  team_points_r16: number;
  team_points_qf: number;
  team_points_sf: number;
  team_points_third: number;
  team_points_final: number;
};

const STAGE_POINTS_KEY: Record<string, keyof BracketConfig | null> = {
  R32: null,
  R16: "team_points_r16",
  QF: "team_points_qf",
  SF: "team_points_sf",
  third_place: "team_points_third",
  final: "team_points_final",
};

export function calculateBracketTeamPoints(
  stage: string,
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  config: BracketConfig
): number {
  const key = STAGE_POINTS_KEY[stage];
  if (!key) return 0;

  const ptsPerTeam = config[key];
  let total = 0;

  if (predHome === actualHome || predHome === actualAway) total += ptsPerTeam;
  if (predAway === actualHome || predAway === actualAway) total += ptsPerTeam;

  return total;
}

export function calculateBracketMatchScore(
  stage: string,
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  predHomeScore: number,
  predAwayScore: number,
  actualHomeScore: number,
  actualAwayScore: number,
  config: BracketConfig
): { teamPoints: number; scorePoints: number } {
  const teamPoints = calculateBracketTeamPoints(
    stage, predHome, predAway, actualHome, actualAway, config
  );

  let scorePoints = 0;
  if (stage === "R32") {
    // R32 fixtures are seeded from groups, so there is no team gate.
    scorePoints = calculateMatchPoints(predHomeScore, predAwayScore, actualHomeScore, actualAwayScore);
  } else {
    const homeMatch = predHome === actualHome || predHome === actualAway;
    const awayMatch = predAway === actualHome || predAway === actualAway;

    if (homeMatch || awayMatch) {
      // Anchor on a matched predicted team and reorient both scorelines from
      // its side (slot-agnostic), then grade with the normal 5/3/2/0 ladder.
      const anchor = homeMatch ? predHome : predAway;
      const predFor = homeMatch ? predHomeScore : predAwayScore;
      const predAgainst = homeMatch ? predAwayScore : predHomeScore;
      const actualFor = anchor === actualHome ? actualHomeScore : actualAwayScore;
      const actualAgainst = anchor === actualHome ? actualAwayScore : actualHomeScore;

      const raw = calculateMatchPoints(predFor, predAgainst, actualFor, actualAgainst);
      // Full credit when both predicted teams match; halved (rounded down) for one.
      scorePoints = homeMatch && awayMatch ? raw : Math.floor(raw / 2);
    }
  }

  return { teamPoints, scorePoints };
}
