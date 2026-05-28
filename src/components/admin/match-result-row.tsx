"use client";

import { useState } from "react";
import { submitMatchResult } from "@/actions/admin";
import { useActionState } from "react";
import { ScoreInput } from "@/components/score-input";

export type Match = {
  id: number;
  kickoff_at: string;
  stage: string;
  home_team: { name: string; code: string };
  away_team: { name: string; code: string };
  group_name: string | null;
  result: {
    home_score: number;
    away_score: number;
    penalty_winner: string | null;
  } | null;
};

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STAGE_LABELS: Record<string, string> = {
  group: "Grupos",
  R32: "Dieciseisavos",
  R16: "Octavos",
  QF: "Cuartos",
  SF: "Semifinal",
  third_place: "3er puesto",
  final: "Final",
};

export function MatchResultRow({ match, overrideLock = false }: { match: Match; overrideLock?: boolean }) {
  const [homeScore, setHomeScore] = useState<string>(
    match.result?.home_score?.toString() ?? ""
  );
  const [awayScore, setAwayScore] = useState<string>(
    match.result?.away_score?.toString() ?? ""
  );
  const [penaltyWinner, setPenaltyWinner] = useState<string | null>(
    match.result?.penalty_winner ?? null
  );

  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      return await submitMatchResult(formData);
    },
    null
  );

  const isFuture = new Date(match.kickoff_at) > new Date();
  const isLocked = isFuture && !overrideLock;
  const isKnockout = match.stage !== "group";
  const homeNum = parseInt(homeScore, 10);
  const awayNum = parseInt(awayScore, 10);
  const isTied =
    !isNaN(homeNum) && !isNaN(awayNum) && homeNum === awayNum;
  const showPenaltyPicker = isKnockout && isTied && !isLocked;

  return (
    <form
      action={formAction}
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${
        isLocked ? "opacity-50" : ""
      }`}
    >
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="stage" value={match.stage} />
      {penaltyWinner && (
        <input type="hidden" name="penalty_winner" value={penaltyWinner} />
      )}

      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 uppercase">
            {STAGE_LABELS[match.stage] ?? match.stage}
          </span>
          {match.group_name && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              Grupo {match.group_name}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {formatKickoff(match.kickoff_at)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-right">
          <p className="font-semibold text-sm">{match.home_team.name}</p>
          <p className="text-xs text-gray-400">{match.home_team.code}</p>
        </div>

        <div className="flex items-center gap-1">
          <ScoreInput
            name="home_score"
            value={homeScore}
            disabled={isLocked}
            onChange={(v) => {
              setHomeScore(String(v));
              setPenaltyWinner(null);
            }}
          />
          <span className="text-gray-300 font-bold">-</span>
          <ScoreInput
            name="away_score"
            value={awayScore}
            disabled={isLocked}
            onChange={(v) => {
              setAwayScore(String(v));
              setPenaltyWinner(null);
            }}
          />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm">{match.away_team.name}</p>
          <p className="text-xs text-gray-400">{match.away_team.code}</p>
        </div>
      </div>

      {showPenaltyPicker && (
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center justify-between">
          <span className="text-xs text-amber-800">
            ¿Quién avanzó en penales?
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPenaltyWinner("home")}
              className={`px-3 py-1 text-xs rounded font-medium border ${
                penaltyWinner === "home"
                  ? "border-green-600 bg-green-50 text-green-600"
                  : "border-gray-300 bg-white text-gray-500"
              }`}
            >
              {match.home_team.code}
              {penaltyWinner === "home" && " ✓"}
            </button>
            <button
              type="button"
              onClick={() => setPenaltyWinner("away")}
              className={`px-3 py-1 text-xs rounded font-medium border ${
                penaltyWinner === "away"
                  ? "border-green-600 bg-green-50 text-green-600"
                  : "border-gray-300 bg-white text-gray-500"
              }`}
            >
              {match.away_team.code}
              {penaltyWinner === "away" && " ✓"}
            </button>
          </div>
        </div>
      )}

      {!isLocked && (
        <button
          type="submit"
          disabled={pending || (showPenaltyPicker && !penaltyWinner)}
          className="mt-3 w-full text-sm bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? "Guardando..." : match.result ? "Actualizar" : "Guardar"}
        </button>
      )}

      {state?.error && (
        <p className="mt-2 text-red-600 text-xs text-center">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-2 text-green-600 text-xs text-center">Resultado guardado.</p>
      )}
    </form>
  );
}