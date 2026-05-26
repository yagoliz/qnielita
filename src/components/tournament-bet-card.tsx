"use client";

import { Countdown } from "./countdown";
import { submitTournamentBet } from "@/actions/bets";
import { useActionState } from "react";

type TournamentBetCardProps = {
  config: {
    category: string;
    label: string;
    points_value: number;
    lock_at: string;
    correct_answer: string | null;
  };
  existingBet?: {
    answer: string;
    points_earned: number | null;
  };
};

export function TournamentBetCard({ config, existingBet }: TournamentBetCardProps) {
  const isLocked = new Date(config.lock_at) <= new Date();

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await submitTournamentBet(formData);
    },
    null
  );

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

        <input
          name="answer"
          type="text"
          defaultValue={existingBet?.answer ?? ""}
          disabled={isLocked}
          placeholder="Tu predicción..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
        />

        {config.correct_answer && (
          <p className="mt-2 text-xs text-gray-500">
            Respuesta correcta: <span className="font-semibold">{config.correct_answer}</span>
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
