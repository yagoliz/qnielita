"use client";

import { useState, useTransition } from "react";
import { ScoreInput } from "../score-input";
import { KNOCKOUT_LABELS, type KnockoutStage } from "@/lib/match-tree";

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type BracketMatchData = {
  matchId: number;
  stage: string;
  kickoffAt: string;
  homeTeam: { id: number; name: string; code: string } | null;
  awayTeam: { id: number; name: string; code: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinner: "home" | "away" | null;
  result?: { home_score: number; away_score: number } | null;
  teamPointsEarned?: number;
  scorePointsEarned?: number;
};

type Props = {
  match: BracketMatchData;
  locked: boolean;
  onScoreChange: (matchId: number, side: "home" | "away", value: number) => void;
  onPenaltyChange: (matchId: number, winner: "home" | "away") => void;
  onSave: (matchId: number) => Promise<{ error?: string; success?: boolean }>;
};

export function BracketMatch({ match, locked, onScoreChange, onPenaltyChange, onSave }: Props) {
  const isTied = match.homeScore != null && match.awayScore != null && match.homeScore === match.awayScore;
  const hasTeams = match.homeTeam && match.awayTeam;
  const totalPoints = (match.teamPointsEarned ?? 0) + (match.scorePointsEarned ?? 0);
  const hasScores = match.homeScore != null && match.awayScore != null;
  const canSave = hasTeams && hasScores && (!isTied || match.penaltyWinner);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error?: string; success?: boolean } | null>(null);

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const result = await onSave(match.matchId);
      setFeedback(result);
    });
  }

  if (!hasTeams) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-300 uppercase">
            {KNOCKOUT_LABELS[match.stage as KnockoutStage] ?? match.stage}
          </span>
          <span className="text-xs text-gray-300">
            {formatKickoff(match.kickoffAt)}
          </span>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Completa los partidos anteriores
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase">
          {KNOCKOUT_LABELS[match.stage as KnockoutStage] ?? match.stage}
        </span>
        <span className="text-xs text-gray-400">
          {formatKickoff(match.kickoffAt)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-right">
          <p className="font-semibold text-sm">{match.homeTeam!.name}</p>
          <p className="text-xs text-gray-400">{match.homeTeam!.code}</p>
        </div>

        <div className="flex items-center gap-1">
          <ScoreInput
            name={`home_${match.matchId}`}
            defaultValue={match.homeScore ?? undefined}
            disabled={locked}
            onChange={(v) => onScoreChange(match.matchId, "home", v)}
          />
          <span className="text-gray-300 font-bold">-</span>
          <ScoreInput
            name={`away_${match.matchId}`}
            defaultValue={match.awayScore ?? undefined}
            disabled={locked}
            onChange={(v) => onScoreChange(match.matchId, "away", v)}
          />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm">{match.awayTeam!.name}</p>
          <p className="text-xs text-gray-400">{match.awayTeam!.code}</p>
        </div>
      </div>

      {isTied && !locked && (
        <div className="mt-2 flex justify-center gap-2">
          <span className="text-xs text-gray-500">Penaltis:</span>
          <button
            type="button"
            onClick={() => onPenaltyChange(match.matchId, "home")}
            className={`text-xs px-2 py-0.5 rounded ${
              match.penaltyWinner === "home"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {match.homeTeam!.code}
          </button>
          <button
            type="button"
            onClick={() => onPenaltyChange(match.matchId, "away")}
            className={`text-xs px-2 py-0.5 rounded ${
              match.penaltyWinner === "away"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {match.awayTeam!.code}
          </button>
        </div>
      )}

      {match.result && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500">
            Resultado: {match.result.home_score} - {match.result.away_score}
          </span>
          {totalPoints > 0 && (
            <span className="ml-2 text-xs font-bold text-green-600">
              +{totalPoints} pts
            </span>
          )}
        </div>
      )}

      {!locked && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !canSave}
          className="mt-3 w-full text-sm bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      )}

      {feedback?.error && (
        <p className="mt-2 text-red-600 text-xs text-center">{feedback.error}</p>
      )}
      {feedback?.success && (
        <p className="mt-2 text-green-600 text-xs text-center">Guardado</p>
      )}
    </div>
  );
}