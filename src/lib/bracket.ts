import type { MatchStage } from "./match-tree";

export type BracketCodeParsed = {
  type: "winner" | "loser";
  matchId: number;
};

export type BracketMapEntry = {
  home: BracketCodeParsed;
  away: BracketCodeParsed;
};

export type MatchPick = {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  penaltyWinner: "home" | "away" | null;
};

export function determineWinner(
  homeScore: number,
  awayScore: number,
  penaltyWinner: "home" | "away" | null
): "home" | "away" {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return penaltyWinner!;
}

export function parseBracketCode(code: string): BracketCodeParsed | null {
  const winMatch = code.match(/^W(\d+)$/);
  if (winMatch) return { type: "winner", matchId: parseInt(winMatch[1], 10) };

  const loseMatch = code.match(/^L(\d+)$/);
  if (loseMatch) return { type: "loser", matchId: parseInt(loseMatch[1], 10) };

  return null;
}

export function buildBracketMap(
  matches: { id: number; home_team_id: number; away_team_id: number; stage: string }[],
  teams: { id: number; code: string }[]
): Map<number, BracketMapEntry> {
  const teamCodeMap = new Map(teams.map((t) => [t.id, t.code]));
  const map = new Map<number, BracketMapEntry>();

  for (const match of matches) {
    if (match.stage === "group" || match.stage === "R32") continue;

    const homeCode = teamCodeMap.get(match.home_team_id);
    const awayCode = teamCodeMap.get(match.away_team_id);
    if (!homeCode || !awayCode) continue;

    const homeParsed = parseBracketCode(homeCode);
    const awayParsed = parseBracketCode(awayCode);
    if (!homeParsed || !awayParsed) continue;

    map.set(match.id, { home: homeParsed, away: awayParsed });
  }

  return map;
}

export function cascadeWinner(pick: MatchPick): number {
  const winner = determineWinner(pick.homeScore, pick.awayScore, pick.penaltyWinner);
  return winner === "home" ? pick.homeTeamId : pick.awayTeamId;
}

export function cascadeLoser(pick: MatchPick): number {
  const winner = determineWinner(pick.homeScore, pick.awayScore, pick.penaltyWinner);
  return winner === "home" ? pick.awayTeamId : pick.homeTeamId;
}

export const STAGE_ORDER: MatchStage[] = [
  "R32", "R16", "QF", "SF", "third_place", "final",
];

export function resolveTeamForSlot(
  entry: BracketCodeParsed,
  picks: Map<number, MatchPick>
): number | null {
  const pick = picks.get(entry.matchId);
  if (!pick) return null;
  return entry.type === "winner" ? cascadeWinner(pick) : cascadeLoser(pick);
}
