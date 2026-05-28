"use client";

import { Countdown } from "./countdown";
import { SearchCombobox, type ComboboxItem } from "./search-combobox";
import { submitCustomBetAnswer } from "@/actions/bets";
import { useActionState, useState } from "react";

type CustomBetCardProps = {
  bet: {
    id: string;
    question: string;
    bet_type: string;
    options: string[] | null;
    points_value: number;
    lock_at: string;
    correct_answer_text: string | null;
    correct_answer_team_id: number | null;
    correct_answer_player_id: string | null;
  };
  existingAnswer?: {
    answer_text: string | null;
    answer_team_id: number | null;
    answer_player_id: string | null;
    points_earned: number | null;
  };
  teams: ComboboxItem[];
  players: ComboboxItem[];
};

function getCorrectAnswerLabel(
  bet: CustomBetCardProps["bet"],
  teams: ComboboxItem[],
  players: ComboboxItem[]
): string | null {
  if (bet.bet_type === "team" && bet.correct_answer_team_id != null) {
    return teams.find((t) => t.id === String(bet.correct_answer_team_id))?.label ?? null;
  }
  if (bet.bet_type === "player" && bet.correct_answer_player_id != null) {
    return players.find((p) => p.id === bet.correct_answer_player_id)?.label ?? null;
  }
  return bet.correct_answer_text;
}

function getExistingValue(
  betType: string,
  answer?: CustomBetCardProps["existingAnswer"]
): string {
  if (!answer) return "";
  if (betType === "team" && answer.answer_team_id != null) return String(answer.answer_team_id);
  if (betType === "player" && answer.answer_player_id != null) return answer.answer_player_id;
  return answer.answer_text ?? "";
}

export function CustomBetCard({ bet, existingAnswer, teams, players }: CustomBetCardProps) {
  const isLocked = new Date(bet.lock_at) <= new Date();
  const isTyped = bet.bet_type === "team" || bet.bet_type === "player";

  const [selected, setSelected] = useState<string>(
    getExistingValue(bet.bet_type, existingAnswer)
  );

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await submitCustomBetAnswer(formData);
    },
    null
  );

  const correctLabel = getCorrectAnswerLabel(bet, teams, players);
  const hasCorrectAnswer = correctLabel != null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-sm flex-1">{bet.question}</h3>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          <span className="text-xs font-bold text-green-600">
            {bet.points_value} pts
          </span>
          <Countdown targetDate={bet.lock_at} />
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="custom_bet_id" value={bet.id} />
        <input type="hidden" name="bet_type" value={bet.bet_type} />

        {bet.bet_type === "yes_no" && (
          <div className="flex gap-2">
            {["Sí", "No"].map((option) => (
              <label
                key={option}
                className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm ${
                  selected === option
                    ? "border-green-600 bg-green-50"
                    : "border-gray-300"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="answer_text"
                  value={option}
                  checked={selected === option}
                  onChange={() => setSelected(option)}
                  disabled={isLocked}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        )}

        {bet.bet_type === "multiple_choice" && bet.options && (
          <div className="space-y-1">
            {bet.options.map((option) => (
              <label
                key={option}
                className={`block px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                  selected === option
                    ? "border-green-600 bg-green-50"
                    : "border-gray-300"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="answer_text"
                  value={option}
                  checked={selected === option}
                  onChange={() => setSelected(option)}
                  disabled={isLocked}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        )}

        {bet.bet_type === "open_text" && (
          <input
            name="answer_text"
            type="text"
            defaultValue={existingAnswer?.answer_text ?? ""}
            disabled={isLocked}
            placeholder="Tu respuesta..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          />
        )}

        {isTyped && (
          <SearchCombobox
            items={bet.bet_type === "team" ? teams : players}
            value={selected || null}
            onChange={(id) => setSelected(id ?? "")}
            disabled={isLocked}
            placeholder={bet.bet_type === "team" ? "Buscar equipo..." : "Buscar jugador..."}
            name={bet.bet_type === "team" ? "answer_team_id" : "answer_player_id"}
          />
        )}

        {hasCorrectAnswer && (
          <p className="mt-2 text-xs text-gray-500">
            Respuesta: <span className="font-semibold">{correctLabel}</span>
            {existingAnswer?.points_earned != null && (
              <span className="ml-2 font-bold text-green-600">
                +{existingAnswer.points_earned} pts
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
            {pending ? "Guardando..." : existingAnswer ? "Actualizar" : "Guardar"}
          </button>
        )}

        {state?.error && (
          <p className="mt-2 text-red-600 text-xs">{state.error}</p>
        )}
      </form>
    </div>
  );
}