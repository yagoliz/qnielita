"use client";

import { submitMatchResult } from "@/actions/admin";
import { useActionState } from "react";

type Match = {
  id: number;
  kickoff_at: string;
  home_team: { name: string; code: string };
  away_team: { name: string; code: string };
  result?: { home_score: number; away_score: number } | null;
};

export function ResultEntryForm({ matches }: { matches: Match[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await submitMatchResult(formData);
    },
    null
  );

  const pastMatches = matches.filter(
    (m) => new Date(m.kickoff_at) <= new Date()
  );

  return (
    <div className="space-y-3">
      {pastMatches.map((match) => (
        <form
          key={match.id}
          action={formAction}
          className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
        >
          <input type="hidden" name="match_id" value={match.id} />
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">
              {match.home_team.code} vs {match.away_team.code}
            </span>
            <div className="flex items-center gap-1">
              <input
                name="home_score"
                type="number"
                min={0}
                defaultValue={match.result?.home_score}
                className="w-12 h-8 text-center border rounded text-sm"
              />
              <span>-</span>
              <input
                name="away_score"
                type="number"
                min={0}
                defaultValue={match.result?.away_score}
                className="w-12 h-8 text-center border rounded text-sm"
              />
              <button
                type="submit"
                disabled={pending}
                className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded font-medium disabled:opacity-50"
              >
                {match.result ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      ))}

      {state?.error && (
        <p className="text-red-600 text-sm">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-green-600 text-sm">Resultado guardado. Puntuaciones recalculadas.</p>
      )}
    </div>
  );
}
