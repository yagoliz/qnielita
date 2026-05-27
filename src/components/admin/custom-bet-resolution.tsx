"use client";

import { resolveCustomBet } from "@/actions/admin";
import { useActionState } from "react";

type CustomBet = {
  id: string;
  question: string;
  bet_type: "yes_no" | "multiple_choice" | "open_text";
  options: string[] | null;
  points_value: number;
  lock_at: string;
  correct_answer: string | null;
};

function SingleCustomBetForm({ bet }: { bet: CustomBet }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await resolveCustomBet(formData);
    },
    null
  );

  const isLocked = new Date(bet.lock_at) <= new Date();

  return (
    <form
      action={formAction}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3"
    >
      <input type="hidden" name="bet_id" value={bet.id} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-sm">{bet.question}</span>
        <span className="text-xs text-gray-400 shrink-0">{bet.points_value} pts</span>
      </div>

      {!isLocked && (
        <p className="text-xs text-amber-600">
          Aún no se ha bloqueado — los usuarios pueden seguir respondiendo.
        </p>
      )}

      {bet.bet_type === "yes_no" && (
        <select
          name="correct_answer"
          defaultValue={bet.correct_answer ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>Selecciona respuesta...</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
        </select>
      )}

      {bet.bet_type === "multiple_choice" && bet.options && (
        <select
          name="correct_answer"
          defaultValue={bet.correct_answer ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>Selecciona respuesta...</option>
          {bet.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )}

      {bet.bet_type === "open_text" && (
        <input
          name="correct_answer"
          type="text"
          defaultValue={bet.correct_answer ?? ""}
          placeholder="Respuesta..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Guardando..." : bet.correct_answer ? "Actualizar" : "Resolver"}
      </button>

      {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-xs">Apuesta resuelta.</p>}
    </form>
  );
}

export function CustomBetResolution({ bets }: { bets: CustomBet[] }) {
  if (bets.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        No hay apuestas locas creadas todavía.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {bets.map((bet) => (
        <SingleCustomBetForm key={bet.id} bet={bet} />
      ))}
    </div>
  );
}