"use client";

import { fillRandomGroupPredictions } from "@/actions/predictions";
import { Dices } from "lucide-react";
import { useActionState } from "react";

type FillState = { error?: string; success?: boolean; filled?: number } | null;

export function FillRandomButton() {
  const [state, formAction, pending] = useActionState(
    async (): Promise<FillState> => {
      return await fillRandomGroupPredictions();
    },
    null
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Se rellenarán al azar los partidos sin predicción. Las predicciones que ya tengas no se tocan. ¿Continuar?"
          )
        ) {
          e.preventDefault();
        }
      }}
      className="mb-4"
    >
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 text-sm border border-green-600 text-green-700 rounded-lg py-2 font-medium hover:bg-green-50 disabled:opacity-50"
      >
        <Dices className="size-4" />
        {pending ? "Rellenando..." : "Me he cansado!"}
      </button>

      {state?.error && (
        <p className="mt-2 text-red-600 text-xs text-center">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-2 text-green-600 text-xs text-center">
          {state.filled && state.filled > 0
            ? `Se rellenaron ${state.filled} partido${state.filled === 1 ? "" : "s"} al azar.`
            : "Ya tenías todos los partidos rellenos."}
        </p>
      )}
    </form>
  );
}