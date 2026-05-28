"use client";

import { useState } from "react";
import { submitMatchResult } from "@/actions/admin";
import { useActionState } from "react";

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
      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 ${
        isLocked ? "opacity-50" : ""
      }`}
    >
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="stage" value={match.stage} />
      {penaltyWinner && (
        <input type="hidden" name="penalty_winner" value={penaltyWinner} />
      )}

      <div className="flex items-center justify-between gap-2 text-sm">
        <div>
          <span className="font-medium">
            {match.home_team.code} vs {match.away_team.code}
          </span>
          {match.group_name && (
            <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              Grupo {match.group_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input
            name="home_score"
            type="number"
            min={0}
            value={homeScore}
            disabled={isLocked}
            onChange={(e) => {
              setHomeScore(e.target.value);
              setPenaltyWinner(null);
            }}
            className="w-12 h-8 text-center border rounded text-sm disabled:bg-gray-50"
          />
          <span>-</span>
          <input
            name="away_score"
            type="number"
            min={0}
            value={awayScore}
            disabled={isLocked}
            onChange={(e) => {
              setAwayScore(e.target.value);
              setPenaltyWinner(null);
            }}
            className="w-12 h-8 text-center border rounded text-sm disabled:bg-gray-50"
          />
          {!isLocked && (
            <button
              type="submit"
              disabled={pending || (showPenaltyPicker && !penaltyWinner)}
              className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded font-medium disabled:opacity-50"
            >
              {match.result ? "Actualizar" : "Guardar"}
            </button>
          )}
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

      {state?.error && (
        <p className="text-red-600 text-xs mt-1">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-green-600 text-xs mt-1">Resultado guardado.</p>
      )}
    </form>
  );
}