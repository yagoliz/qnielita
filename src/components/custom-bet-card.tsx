"use client";

import { Countdown } from "./countdown";
import { submitCustomBetAnswer } from "@/actions/bets";
import { useActionState } from "react";

type CustomBetCardProps = {
  bet: {
    id: string;
    question: string;
    bet_type: string;
    options: string[] | null;
    points_value: number;
    lock_at: string;
    correct_answer: string | null;
  };
  existingAnswer?: {
    answer: string;
    points_earned: number | null;
  };
};

export function CustomBetCard({ bet, existingAnswer }: CustomBetCardProps) {
  const isLocked = new Date(bet.lock_at) <= new Date();

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await submitCustomBetAnswer(formData);
    },
    null
  );

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

        {bet.bet_type === "yes_no" && (
          <div className="flex gap-2">
            {["Sí", "No"].map((option) => (
              <label
                key={option}
                className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm ${
                  existingAnswer?.answer === option
                    ? "border-green-600 bg-green-50"
                    : "border-gray-300"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  defaultChecked={existingAnswer?.answer === option}
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
                  existingAnswer?.answer === option
                    ? "border-green-600 bg-green-50"
                    : "border-gray-300"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  defaultChecked={existingAnswer?.answer === option}
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
            name="answer"
            type="text"
            defaultValue={existingAnswer?.answer ?? ""}
            disabled={isLocked}
            placeholder="Tu respuesta..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          />
        )}

        {bet.correct_answer && (
          <p className="mt-2 text-xs text-gray-500">
            Respuesta: <span className="font-semibold">{bet.correct_answer}</span>
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
