"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { BracketStage } from "./bracket-stage";
import { submitBracket, submitSingleBracketMatch } from "@/actions/bracket";
import {
  type BracketMapEntry,
  type MatchPick,
  cascadeWinner,
  cascadeLoser,
} from "@/lib/bracket";
import { KNOCKOUT_STAGE_ORDER, type KnockoutStage } from "@/lib/match-tree";
import {
  buildBracketTeamComparison,
  isRealTeamCode,
  type BracketComparison,
} from "@/lib/bracket-team-comparison";
import type { BracketMatchData } from "./bracket-match";

type Team = { id: number; name: string; code: string };

type KnockoutMatch = {
  id: number;
  stage: string;
  kickoff_at: string;
  home_team_id: number;
  away_team_id: number;
};

type ExistingPrediction = {
  match_id: number;
  predicted_home_team_id: number;
  predicted_away_team_id: number;
  home_score: number;
  away_score: number;
  penalty_winner: "home" | "away" | null;
  team_points_earned: number;
  score_points_earned: number;
};

type MatchResult = {
  match_id: number;
  home_score: number;
  away_score: number;
};

type Props = {
  matches: KnockoutMatch[];
  teamsById: Record<number, Team>;
  bracketMap: [number, BracketMapEntry][];
  existingPredictions: ExistingPrediction[];
  results: MatchResult[];
  locked: boolean;
};

type MatchState = {
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinner: "home" | "away" | null;
};

type BracketState = Map<number, MatchState>;

function initState(
  matches: KnockoutMatch[],
  existing: ExistingPrediction[]
): BracketState {
  const predMap = new Map(existing.map((p) => [p.match_id, p]));
  const state = new Map<number, MatchState>();

  for (const m of matches) {
    const pred = predMap.get(m.id);
    state.set(m.id, {
      homeScore: pred?.home_score ?? null,
      awayScore: pred?.away_score ?? null,
      penaltyWinner: pred?.penalty_winner ?? null,
    });
  }

  return state;
}

function resolveAllTeams(
  matches: KnockoutMatch[],
  state: BracketState,
  bracketMap: Map<number, BracketMapEntry>,
  teamsById: Record<number, Team>
): Map<number, { home: Team | null; away: Team | null }> {
  const resolved = new Map<number, { home: Team | null; away: Team | null }>();
  const picksByMatch = new Map<number, MatchPick>();

  const matchesByStage = new Map<string, KnockoutMatch[]>();
  for (const m of matches) {
    const list = matchesByStage.get(m.stage) ?? [];
    list.push(m);
    matchesByStage.set(m.stage, list);
  }

  for (const stage of KNOCKOUT_STAGE_ORDER) {
    const stageMatches = matchesByStage.get(stage) ?? [];

    for (const m of stageMatches) {
      const entry = bracketMap.get(m.id);

      if (!entry) {
        const home = teamsById[m.home_team_id] ?? null;
        const away = teamsById[m.away_team_id] ?? null;
        resolved.set(m.id, { home, away });
      } else {
        let homeTeamId: number | null = null;
        let awayTeamId: number | null = null;

        const homePick = picksByMatch.get(entry.home.matchId);
        if (homePick) {
          homeTeamId = entry.home.type === "winner"
            ? cascadeWinner(homePick)
            : cascadeLoser(homePick);
        }

        const awayPick = picksByMatch.get(entry.away.matchId);
        if (awayPick) {
          awayTeamId = entry.away.type === "winner"
            ? cascadeWinner(awayPick)
            : cascadeLoser(awayPick);
        }

        resolved.set(m.id, {
          home: homeTeamId ? teamsById[homeTeamId] ?? null : null,
          away: awayTeamId ? teamsById[awayTeamId] ?? null : null,
        });
      }

      const s = state.get(m.id);
      const teams = resolved.get(m.id)!;
      if (
        s && teams.home && teams.away &&
        s.homeScore != null && s.awayScore != null &&
        (s.homeScore !== s.awayScore || s.penaltyWinner)
      ) {
        picksByMatch.set(m.id, {
          homeTeamId: teams.home.id,
          awayTeamId: teams.away.id,
          homeScore: s.homeScore,
          awayScore: s.awayScore,
          penaltyWinner: s.penaltyWinner,
        });
      }
    }
  }

  return resolved;
}

export function BracketView({
  matches,
  teamsById,
  bracketMap: bracketMapEntries,
  existingPredictions,
  results,
  locked,
}: Props) {
  const bracketMap = useMemo(() => new Map(bracketMapEntries), [bracketMapEntries]);
  const [state, setState] = useState<BracketState>(() =>
    initState(matches, existingPredictions)
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error?: string; success?: boolean } | null>(null);

  const resultMap = useMemo(() => new Map(results.map((r) => [r.match_id, r])), [results]);
  const predMap = useMemo(() => new Map(existingPredictions.map((p) => [p.match_id, p])), [existingPredictions]);

  const resolvedTeams = useMemo(
    () => resolveAllTeams(matches, state, bracketMap, teamsById),
    [matches, state, bracketMap, teamsById]
  );

  const handleScoreChange = useCallback((matchId: number, side: "home" | "away", value: number) => {
    setState((prev) => {
      const next = new Map(prev);
      const current = next.get(matchId)!;
      next.set(matchId, {
        ...current,
        [side === "home" ? "homeScore" : "awayScore"]: value,
        penaltyWinner: null,
      });
      return next;
    });
    setFeedback(null);
  }, []);

  const handlePenaltyChange = useCallback((matchId: number, winner: "home" | "away") => {
    setState((prev) => {
      const next = new Map(prev);
      const current = next.get(matchId)!;
      next.set(matchId, { ...current, penaltyWinner: winner });
      return next;
    });
    setFeedback(null);
  }, []);

  const handleSingleSave = useCallback(async (matchId: number) => {
    const s = state.get(matchId)!;
    const teams = resolvedTeams.get(matchId)!;

    if (!teams.home || !teams.away) {
      return { error: "Los equipos de este partido aún no están definidos." };
    }
    if (s.homeScore == null || s.awayScore == null) {
      return { error: "Introduce un resultado." };
    }

    const prediction = {
      match_id: matchId,
      predicted_home_team_id: teams.home.id,
      predicted_away_team_id: teams.away.id,
      home_score: s.homeScore,
      away_score: s.awayScore,
      penalty_winner: s.homeScore === s.awayScore ? s.penaltyWinner : null,
    };

    return await submitSingleBracketMatch(prediction);
  }, [state, resolvedTeams]);

  const handleSubmit = () => {
    const predictions = matches.map((m) => {
      const s = state.get(m.id)!;
      const teams = resolvedTeams.get(m.id)!;
      return {
        match_id: m.id,
        predicted_home_team_id: teams.home?.id ?? 0,
        predicted_away_team_id: teams.away?.id ?? 0,
        home_score: s.homeScore ?? 0,
        away_score: s.awayScore ?? 0,
        penalty_winner: s.homeScore === s.awayScore ? s.penaltyWinner : null,
      };
    });

    const incomplete = predictions.filter(
      (p) => p.predicted_home_team_id === 0 || p.predicted_away_team_id === 0
    );
    if (incomplete.length > 0) {
      setFeedback({ error: "Completa todos los partidos antes de guardar." });
      return;
    }

    startTransition(async () => {
      const result = await submitBracket(predictions);
      setFeedback(result);
    });
  };

  const matchesByStage = useMemo(() => {
    const map = new Map<KnockoutStage, BracketMatchData[]>();
    for (const m of matches) {
      const stage = m.stage as KnockoutStage;
      const s = state.get(m.id)!;
      const teams = resolvedTeams.get(m.id)!;
      const pred = predMap.get(m.id);
      const result = resultMap.get(m.id);

      let comparison: BracketComparison | undefined;
      if (locked) {
        const predHome = pred ? teamsById[pred.predicted_home_team_id] ?? null : null;
        const predAway = pred ? teamsById[pred.predicted_away_team_id] ?? null : null;
        const aHomeRaw = teamsById[m.home_team_id] ?? null;
        const aAwayRaw = teamsById[m.away_team_id] ?? null;
        const aHome = aHomeRaw && isRealTeamCode(aHomeRaw.code) ? aHomeRaw : null;
        const aAway = aAwayRaw && isRealTeamCode(aAwayRaw.code) ? aAwayRaw : null;
        comparison = buildBracketTeamComparison(predHome, predAway, aHome, aAway);
      }

      const entry: BracketMatchData = {
        matchId: m.id,
        stage: m.stage,
        kickoffAt: m.kickoff_at,
        homeTeam: locked ? comparison?.home.predicted ?? teams.home : teams.home,
        awayTeam: locked ? comparison?.away.predicted ?? teams.away : teams.away,
        homeScore: s.homeScore,
        awayScore: s.awayScore,
        penaltyWinner: s.penaltyWinner,
        result: result ?? null,
        teamPointsEarned: pred?.team_points_earned ?? 0,
        scorePointsEarned: pred?.score_points_earned ?? 0,
        comparison,
      };

      const list = map.get(stage) ?? [];
      list.push(entry);
      map.set(stage, list);
    }
    return map;
  }, [matches, state, resolvedTeams, predMap, resultMap, locked, teamsById]);

  const hasExisting = existingPredictions.length > 0;

  return (
    <div>
      {KNOCKOUT_STAGE_ORDER.map((stage) => {
        const stageMatches = matchesByStage.get(stage);
        if (!stageMatches?.length) return null;
        return (
          <BracketStage
            key={stage}
            stage={stage}
            matches={stageMatches}
            locked={locked}
            onScoreChange={handleScoreChange}
            onPenaltyChange={handlePenaltyChange}
            onSave={handleSingleSave}
          />
        );
      })}

      {!locked && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isPending
              ? "Guardando..."
              : hasExisting
                ? "Actualizar todo"
                : "Guardar todo"}
          </button>

          {feedback?.error && (
            <p className="mt-2 text-red-600 text-sm text-center">{feedback.error}</p>
          )}
          {feedback?.success && (
            <p className="mt-2 text-green-600 text-sm text-center">
              Predicciones guardadas correctamente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
