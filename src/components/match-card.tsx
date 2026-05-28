"use client";

import { ScoreInput } from "./score-input";
import { submitMatchPrediction } from "@/actions/predictions";
import { useActionState } from "react";

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type MatchCardProps = {
  match: {
    id: number;
    kickoff_at: string;
    venue: string | null;
    stage: string;
    home_team: { name: string; code: string };
    away_team: { name: string; code: string };
  };
  prediction?: {
    home_score: number;
    away_score: number;
    points_earned: number | null;
  };
  result?: {
    home_score: number;
    away_score: number;
  };
};

const GROUP_STAGE_LOCK = new Date("2026-06-11T18:00:00Z");

export function MatchCard({ match, prediction, result }: MatchCardProps) {
  const isLocked = match.stage === "group"
    ? GROUP_STAGE_LOCK <= new Date()
    : new Date(match.kickoff_at) <= new Date();

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await submitMatchPrediction(formData);
    },
    null
  );

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase">
          {match.stage === "group" ? "Grupos" : match.stage}
        </span>
        <span className="text-xs text-gray-400">
          {formatKickoff(match.kickoff_at)}
        </span>
      </div>

      <form action={formAction}>
        <input type="hidden" name="match_id" value={match.id} />

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-right">
            <p className="font-semibold text-sm">{match.home_team.name}</p>
            <p className="text-xs text-gray-400">{match.home_team.code}</p>
          </div>

          <div className="flex items-center gap-1">
            <ScoreInput
              name="home_score"
              defaultValue={prediction?.home_score}
              disabled={isLocked}
            />
            <span className="text-gray-300 font-bold">-</span>
            <ScoreInput
              name="away_score"
              defaultValue={prediction?.away_score}
              disabled={isLocked}
            />
          </div>

          <div className="flex-1">
            <p className="font-semibold text-sm">{match.away_team.name}</p>
            <p className="text-xs text-gray-400">{match.away_team.code}</p>
          </div>
        </div>

        {result && (
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-500">
              Resultado: {result.home_score} - {result.away_score}
            </span>
            {prediction?.points_earned != null && (
              <span className="ml-2 text-xs font-bold text-green-600">
                +{prediction.points_earned} pts
              </span>
            )}
          </div>
        )}

        {!isLocked && (
          <button
            type="submit"
            disabled={pending}
            className="mt-3 w-full text-sm bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {pending ? "Guardando..." : prediction ? "Actualizar" : "Guardar"}
          </button>
        )}

        {state?.error && (
          <p className="mt-2 text-red-600 text-xs text-center">{state.error}</p>
        )}
      </form>
    </div>
  );
}
