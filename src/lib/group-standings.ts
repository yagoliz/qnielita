export type GroupStageResult = {
  match_id: number;
  group_id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number;
  away_score: number;
};

export type Standing = {
  team_id: number;
  played: number;
  pts: number;
  gd: number;
  gf: number;
  ga: number;
};

export function computeGroupStandings(
  teamIds: number[],
  results: GroupStageResult[]
): Standing[] {
  const byTeam = new Map<number, Standing>();
  for (const id of teamIds) {
    byTeam.set(id, { team_id: id, played: 0, pts: 0, gd: 0, gf: 0, ga: 0 });
  }

  for (const m of results) {
    const home = byTeam.get(m.home_team_id);
    const away = byTeam.get(m.away_team_id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.gf += m.home_score;
    home.ga += m.away_score;
    home.gd = home.gf - home.ga;
    away.gf += m.away_score;
    away.ga += m.home_score;
    away.gd = away.gf - away.ga;

    if (m.home_score > m.away_score) home.pts += 3;
    else if (m.home_score < m.away_score) away.pts += 3;
    else {
      home.pts += 1;
      away.pts += 1;
    }
  }

  return [...byTeam.values()].sort((a, b) => {
    if (a.pts !== b.pts) return b.pts - a.pts;
    if (a.gd !== b.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}

function isTied(a: Standing, b: Standing): boolean {
  return a.pts === b.pts && a.gd === b.gd && a.gf === b.gf;
}

export function resolveGroupCode(
  code: string,
  standingsByGroupName: Map<string, Standing[]>
): number | null {
  const match = code.match(/^([12])([A-L])$/);
  if (!match) return null;

  const position = parseInt(match[1], 10);
  const groupName = match[2];
  const standings = standingsByGroupName.get(groupName);
  if (!standings || standings.length < 3) return null;

  if (isTied(standings[0], standings[1])) return null;
  if (position === 2 && isTied(standings[1], standings[2])) return null;

  return standings[position - 1].team_id;
}

export type TeamRef = { id: number; name: string; code: string };

export type GroupMatchInput = {
  id: number;
  stage: string;
  group_id: number | null;
  group_name: string | null;
  home_team: TeamRef;
  away_team: TeamRef;
};

export type PredictionScore = {
  match_id: number;
  home_score: number;
  away_score: number;
};

export type PredictedGroup = {
  groupId: number;
  groupName: string;
  standings: Standing[];
  teamsById: Record<number, TeamRef>;
  predictedCount: number;
  totalCount: number;
};

export function buildPredictedStandings(
  matches: GroupMatchInput[],
  predictions: PredictionScore[]
): PredictedGroup[] {
  const predById = new Map(predictions.map((p) => [p.match_id, p]));

  type Acc = {
    name: string;
    teamIds: Set<number>;
    teamsById: Record<number, TeamRef>;
    results: GroupStageResult[];
    totalCount: number;
    predictedCount: number;
  };
  const byGroup = new Map<number, Acc>();

  for (const m of matches) {
    if (m.stage !== "group" || m.group_id == null) continue;

    let g = byGroup.get(m.group_id);
    if (!g) {
      g = {
        name: m.group_name ?? "",
        teamIds: new Set(),
        teamsById: {},
        results: [],
        totalCount: 0,
        predictedCount: 0,
      };
      byGroup.set(m.group_id, g);
    }

    g.teamIds.add(m.home_team.id);
    g.teamIds.add(m.away_team.id);
    g.teamsById[m.home_team.id] = m.home_team;
    g.teamsById[m.away_team.id] = m.away_team;
    g.totalCount++;

    const p = predById.get(m.id);
    if (p) {
      g.predictedCount++;
      g.results.push({
        match_id: m.id,
        group_id: m.group_id,
        home_team_id: m.home_team.id,
        away_team_id: m.away_team.id,
        home_score: p.home_score,
        away_score: p.away_score,
      });
    }
  }

  const out: PredictedGroup[] = [];
  for (const [groupId, g] of byGroup) {
    out.push({
      groupId,
      groupName: g.name,
      standings: computeGroupStandings([...g.teamIds], g.results),
      teamsById: g.teamsById,
      predictedCount: g.predictedCount,
      totalCount: g.totalCount,
    });
  }
  out.sort((a, b) => a.groupName.localeCompare(b.groupName));
  return out;
}