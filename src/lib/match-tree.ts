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

export function buildMatchTree(
  matches: MatchInput[],
  predictions: PredictionInput[],
  results: ResultInput[]
): MatchTree {
  const predictionMap = new Map(predictions.map((p) => [p.match_id, p]));
  const resultMap = new Map(results.map((r) => [r.match_id, r]));

  const enrich = (m: MatchInput): MatchEnriched => {
    const p = predictionMap.get(m.id);
    const r = resultMap.get(m.id);
    return {
      id: m.id,
      kickoff_at: m.kickoff_at,
      venue: m.venue,
      stage: m.stage,
      group_id: m.group_id,
      home_team: m.home_team,
      away_team: m.away_team,
      prediction: p
        ? { home_score: p.home_score, away_score: p.away_score, points_earned: p.points_earned }
        : undefined,
      result: r
        ? { home_score: r.home_score, away_score: r.away_score }
        : undefined,
    };
  };

  const byGroup = new Map<number, { name: string; matches: MatchInput[] }>();
  for (const m of matches) {
    if (m.stage !== "group" || m.group_id == null) continue;
    const entry = byGroup.get(m.group_id) ?? {
      name: m.group_name ?? "",
      matches: [],
    };
    entry.matches.push(m);
    byGroup.set(m.group_id, entry);
  }

  const groups: GroupNode[] = [];
  for (const [groupId, { name, matches: groupMatches }] of byGroup) {
    const sorted = [...groupMatches].sort((a, b) =>
      a.kickoff_at.localeCompare(b.kickoff_at)
    );

    const matchdays: MatchdayNode[] = [];
    for (let i = 0; i < sorted.length; i += 2) {
      const number = (Math.floor(i / 2) + 1) as 1 | 2 | 3;
      const pair = sorted.slice(i, i + 2).map(enrich);
      const predictedCount = pair.filter((m) => m.prediction).length;
      matchdays.push({
        number,
        label: `Jornada ${number}`,
        key: matchdayKey(groupId, number),
        matches: pair,
        predictedCount,
        totalCount: pair.length,
      });
    }

    const totalCount = sorted.length;
    const predictedCount = matchdays.reduce(
      (sum, md) => sum + md.predictedCount,
      0
    );

    groups.push({
      id: groupId,
      name,
      label: `Grupo ${name}`,
      matchdays,
      predictedCount,
      totalCount,
    });
  }

  groups.sort((a, b) => a.name.localeCompare(b.name));

  const byStage = new Map<KnockoutStage, MatchInput[]>();
  for (const m of matches) {
    if (m.stage === "group") continue;
    const stage = m.stage as KnockoutStage;
    const bucket = byStage.get(stage) ?? [];
    bucket.push(m);
    byStage.set(stage, bucket);
  }

  const knockout: KnockoutNode[] = [];
  for (const stage of KNOCKOUT_STAGE_ORDER) {
    const stageMatches = byStage.get(stage);
    if (!stageMatches?.length) continue;
    const sorted = [...stageMatches]
      .sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at))
      .map(enrich);
    const predictedCount = sorted.filter((m) => m.prediction).length;
    knockout.push({
      stage,
      label: KNOCKOUT_LABELS[stage],
      matches: sorted,
      predictedCount,
      totalCount: sorted.length,
    });
  }

  return { groupStage: { groups }, knockout };
}

export function computeDefaultOpen(tree: MatchTree, now: Date): DefaultOpen {
  type Candidate = {
    kickoff: number;
    groupId?: number;
    matchdayKey?: string;
    knockoutStage?: KnockoutStage;
  };

  const nowMs = now.getTime();
  const candidates: Candidate[] = [];

  for (const group of tree.groupStage.groups) {
    for (const md of group.matchdays) {
      for (const m of md.matches) {
        const kickoff = new Date(m.kickoff_at).getTime();
        if (kickoff >= nowMs) {
          candidates.push({
            kickoff,
            groupId: group.id,
            matchdayKey: md.key,
          });
        }
      }
    }
  }

  for (const node of tree.knockout) {
    for (const m of node.matches) {
      const kickoff = new Date(m.kickoff_at).getTime();
      if (kickoff >= nowMs) {
        candidates.push({ kickoff, knockoutStage: node.stage });
      }
    }
  }

  if (candidates.length === 0) return {};

  candidates.sort((a, b) => a.kickoff - b.kickoff);
  const next = candidates[0];
  const open: DefaultOpen = {};
  if (next.groupId != null) open.groupId = next.groupId;
  if (next.matchdayKey != null) open.matchdayKey = next.matchdayKey;
  if (next.knockoutStage != null) open.knockoutStage = next.knockoutStage;
  return open;
}

export type TabView = "grupos" | "eliminatorias";

export function sliceTree(tree: MatchTree, view: TabView): MatchTree {
  if (view === "grupos") {
    return { groupStage: tree.groupStage, knockout: [] };
  }
  return { groupStage: { groups: [] }, knockout: tree.knockout };
}

export function resolveActiveTab(
  paramValue: string | undefined,
  tree: MatchTree,
  now: Date
): TabView {
  if (paramValue === "grupos") return "grupos";
  if (paramValue === "eliminatorias") return "eliminatorias";

  if (tree.knockout.length === 0) return "grupos";

  const open = computeDefaultOpen(tree, now);
  return open.knockoutStage ? "eliminatorias" : "grupos";
}