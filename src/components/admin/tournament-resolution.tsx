"use client";

import { resolveTournamentBet } from "@/actions/admin";
import { SearchCombobox, type ComboboxItem } from "@/components/search-combobox";
import { useActionState, useState } from "react";

type Config = {
  category: string;
  label: string;
  answer_type: "team" | "player" | "text";
  points_value: number;
  correct_answer_text: string | null;
  correct_answer_team_id: number | null;
  correct_answer_player_id: string | null;
};

function getExistingCorrectId(config: Config): string | null {
  if (config.answer_type === "team" && config.correct_answer_team_id != null) {
    return String(config.correct_answer_team_id);
  }
  if (config.answer_type === "player" && config.correct_answer_player_id != null) {
    return config.correct_answer_player_id;
  }
  return null;
}

function SingleResolutionForm({
  config,
  teams,
  players,
}: {
  config: Config;
  teams: ComboboxItem[];
  players: ComboboxItem[];
}) {
  const isTyped = config.answer_type === "team" || config.answer_type === "player";
  const [selectedId, setSelectedId] = useState<string | null>(getExistingCorrectId(config));

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await resolveTournamentBet(formData);
    },
    null
  );

  const hasCorrectAnswer =
    config.correct_answer_text != null ||
    config.correct_answer_team_id != null ||
    config.correct_answer_player_id != null;

  return (
    <form
      action={formAction}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3"
    >
      <input type="hidden" name="category" value={config.category} />
      <input type="hidden" name="answer_type" value={config.answer_type} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-sm">{config.label}</span>
        <span className="text-xs text-gray-400 shrink-0">{config.points_value} pts</span>
      </div>
      <div className="flex gap-2">
        {isTyped ? (
          <div className="flex-1">
            <SearchCombobox
              items={config.answer_type === "team" ? teams : players}
              value={selectedId}
              onChange={setSelectedId}
              placeholder={config.answer_type === "team" ? "Buscar equipo..." : "Buscar jugador..."}
              name={config.answer_type === "team" ? "correct_answer_team_id" : "correct_answer_player_id"}
            />
          </div>
        ) : (
          <input
            name="correct_answer_text"
            type="text"
            defaultValue={config.correct_answer_text ?? ""}
            placeholder="Respuesta..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        )}
        <button
          type="submit"
          disabled={pending}
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {hasCorrectAnswer ? "Actualizar" : "Resolver"}
        </button>
      </div>
      {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-xs">Apuesta resuelta.</p>}
    </form>
  );
}

export function TournamentResolution({
  configs,
  teams,
  players,
}: {
  configs: Config[];
  teams: ComboboxItem[];
  players: ComboboxItem[];
}) {
  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <SingleResolutionForm key={config.category} config={config} teams={teams} players={players} />
      ))}
    </div>
  );
}