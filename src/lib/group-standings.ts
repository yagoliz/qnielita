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