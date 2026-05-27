export type MatchStage =
  | "group"
  | "R32"
  | "R16"
  | "QF"
  | "SF"
  | "third_place"
  | "final";

export type MatchInput = {
  id: number;
  kickoff_at: string;
  venue: string | null;
  stage: MatchStage;
  group_id: number | null;
  home_team: { name: string; code: string };
  away_team: { name: string; code: string };
  group_name: string | null;
};

export type PredictionInput = {
  match_id: number;
  home_score: number;
  away_score: number;
  points_earned: number | null;
};

export type ResultInput = {
  match_id: number;
  home_score: number;
  away_score: number;
};

export type MatchEnriched = {
  id: number;
  kickoff_at: string;
  venue: string | null;
  stage: MatchStage;
  group_id: number | null;
  home_team: { name: string; code: string };
  away_team: { name: string; code: string };
  prediction?: { home_score: number; away_score: number; points_earned: number | null };
  result?: { home_score: number; away_score: number };
};

export type MatchdayNode = {
  number: 1 | 2 | 3;
  label: string;
  key: string;
  matches: MatchEnriched[];
  predictedCount: number;
  totalCount: number;
};

export type GroupNode = {
  id: number;
  name: string;
  label: string;
  matchdays: MatchdayNode[];
  predictedCount: number;
  totalCount: number;
};

export type KnockoutStage = Exclude<MatchStage, "group">;

export type KnockoutNode = {
  stage: KnockoutStage;
  label: string;
  matches: MatchEnriched[];
  predictedCount: number;
  totalCount: number;
};

export type MatchTree = {
  groupStage: { groups: GroupNode[] };
  knockout: KnockoutNode[];
};

export type DefaultOpen = {
  groupId?: number;
  matchdayKey?: string;
  knockoutStage?: KnockoutStage;
};

export const KNOCKOUT_STAGE_ORDER: KnockoutStage[] = [
  "R32",
  "R16",
  "QF",
  "SF",
  "third_place",
  "final",
];

export const KNOCKOUT_LABELS: Record<KnockoutStage, string> = {
  R32: "Dieciseisavos",
  R16: "Octavos de Final",
  QF: "Cuartos de Final",
  SF: "Semifinales",
  third_place: "Tercer Puesto",
  final: "Final",
};

export function matchdayKey(groupId: number, number: 1 | 2 | 3): string {
  return `${groupId}-${number}`;
}