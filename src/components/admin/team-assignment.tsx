"use client";

import { useActionState } from "react";
import { assignKnockoutTeam } from "@/actions/admin";

type Team = { id: number; name: string; code: string };
type Match = {
  id: number;
  kickoff_at: string;
  stage: string;
  home_team: Team | null;
  away_team: Team | null;
};

export function TeamAssignment({
  matches,
  realTeams,
}: {
  matches: Match[];
  realTeams: Team[];
}) {
  const r32Matches = matches
    .filter((m) => m.stage === "R32")
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime());

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-2">
        Asigna los equipos reales a cada partido de dieciseisavos.
      </p>
      {r32Matches.map((match) => (
        <TeamAssignmentRow
          key={match.id}
          match={match}
          realTeams={realTeams}
        />
      ))}
    </div>
  );
}

function isPlaceholder(team: Team | null) {
  return team && /^[12][A-L]$|^3[A-Z]+$|^[WL]\d+$/.test(team.code);
}

function TeamAssignmentRow({
  match,
  realTeams,
}: {
  match: Match;
  realTeams: Team[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await assignKnockoutTeam(formData);
    },
    null
  );

  const homePlaceholder = isPlaceholder(match.home_team);
  const awayPlaceholder = isPlaceholder(match.away_team);

  return (
    <form action={formAction} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
      <input type="hidden" name="match_id" value={match.id} />

      <div className="text-xs text-gray-400 mb-2">
        Partido {match.id} —{" "}
        {new Date(match.kickoff_at).toLocaleDateString("es", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        })}
      </div>

      <div className="flex items-center gap-2">
        <select
          name="home_team_id"
          defaultValue={match.home_team?.id}
          className="flex-1 text-sm border rounded-md px-2 py-1.5"
        >
          {homePlaceholder && (
            <option value={match.home_team!.id}>
              {match.home_team!.name}
            </option>
          )}
          {realTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.code} — {t.name}
            </option>
          ))}
        </select>

        <span className="text-gray-300 font-bold text-sm">vs</span>

        <select
          name="away_team_id"
          defaultValue={match.away_team?.id}
          className="flex-1 text-sm border rounded-md px-2 py-1.5"
        >
          {awayPlaceholder && (
            <option value={match.away_team!.id}>
              {match.away_team!.name}
            </option>
          )}
          {realTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.code} — {t.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={pending}
          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 shrink-0"
        >
          {pending ? "..." : "Asignar"}
        </button>
      </div>

      {state?.error && (
        <p className="mt-1 text-red-600 text-xs">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-1 text-green-600 text-xs">Asignado</p>
      )}
    </form>
  );
}
