"use client";

import { Countdown } from "./countdown";
import { SearchCombobox, type ComboboxItem } from "./search-combobox";
import { submitTournamentBet } from "@/actions/bets";
import { useActionState, useState } from "react";

type TournamentBetCardProps = {
  config: {
    category: string;
    label: string;
    answer_type: "team" | "player" | "text";
    points_value: number;
    lock_at: string;
    correct_answer_text: string | null;
    correct_answer_team_id: number | null;
    correct_answer_player_id: string | null;
  };
  existingBet?: {
    answer_text: string | null;
    answer_team_id: number | null;
    answer_player_id: string | null;
    points_earned: number | null;
  };
  teams: ComboboxItem[];
  players: ComboboxItem[];
};

function getCorrectAnswerLabel(
  config: TournamentBetCardProps["config"],
  teams: ComboboxItem[],
  players: ComboboxItem[]
): string | null {
  if (config.answer_type === "team" && config.correct_answer_team_id != null) {
    return teams.find((t) => t.id === String(config.correct_answer_team_id))?.label ?? null;
  }
  if (config.answer_type === "player" && config.correct_answer_player_id != null) {
    return players.find((p) => p.id === config.correct_answer_player_id)?.label ?? null;
  }
  return config.correct_answer_text;
}

function getExistingValue(
  answerType: string,
  bet?: TournamentBetCardProps["existingBet"]
): string | null {
  if (!bet) return null;
  if (answerType === "team" && bet.answer_team_id != null) return String(bet.answer_team_id);
  if (answerType === "player" && bet.answer_player_id != null) return bet.answer_player_id;
  return null;
}

export function TournamentBetCard({ config, existingBet, teams, players }: TournamentBetCardProps) {
  const isLocked = new Date(config.lock_at) <= new Date();
  const isTyped = config.answer_type === "team" || config.answer_type === "player";

  const [selectedId, setSelectedId] = useState<string | null>(
    getExistingValue(config.answer_type, existingBet)
  );

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await submitTournamentBet(formData);
    },
    null
  );

  const correctLabel = getCorrectAnswerLabel(config, teams, players);
  const hasCorrectAnswer = correctLabel != null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{config.label}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-green-600">
            {config.points_value} pts
          </span>
          <Countdown targetDate={config.lock_at} />
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="category" value={config.category} />
        <input type="hidden" name="answer_type" value={config.answer_type} />

        {isTyped ? (
          <SearchCombobox
            items={config.answer_type === "team" ? teams : players}
            value={selectedId}
            onChange={setSelectedId}
            disabled={isLocked}
            placeholder={config.answer_type === "team" ? "Buscar equipo..." : "Buscar jugador..."}
            name={config.answer_type === "team" ? "answer_team_id" : "answer_player_id"}
          />
        ) : (
          <input
            name="answer_text"
            type="text"
            defaultValue={existingBet?.answer_text ?? ""}
            disabled={isLocked}
            placeholder="Tu predicción..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          />
        )}

        {hasCorrectAnswer && (
          <p className="mt-2 text-xs text-gray-500">
            Respuesta correcta: <span className="font-semibold">{correctLabel}</span>
            {existingBet?.points_earned != null && (
              <span className="ml-2 font-bold text-green-600">
                +{existingBet.points_earned} pts
              </span>
            )}
          </p>
        )}

        {!isLocked && (
          <button
            type="submit"
            disabled={pending}
            className="mt-3 w-full text-sm bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {pending ? "Guardando..." : existingBet ? "Actualizar" : "Guardar"}
          </button>
        )}

        {state?.error && (
          <p className="mt-2 text-red-600 text-xs">{state.error}</p>
        )}
      </form>
    </div>
  );
}