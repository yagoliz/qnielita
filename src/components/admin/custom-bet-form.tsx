"use client";

import { createCustomBet } from "@/actions/admin";
import { useActionState } from "react";

export function CustomBetForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await createCustomBet(formData);
    },
    null
  );

  return (
    <form action={formAction} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
      <h3 className="font-semibold text-sm">Nueva apuesta loca</h3>

      <input
        name="question"
        type="text"
        required
        placeholder="Pregunta..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      <select
        name="bet_type"
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="yes_no">Sí / No</option>
        <option value="multiple_choice">Opción múltiple</option>
        <option value="open_text">Texto libre</option>
        <option value="team">Equipo</option>
        <option value="player">Jugador</option>
      </select>

      <input
        name="options"
        type="text"
        placeholder="Opciones separadas por coma (solo para opción múltiple)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="flex gap-2">
        <input
          name="points_value"
          type="number"
          min={1}
          max={20}
          defaultValue={3}
          required
          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <span className="text-sm text-gray-500 self-center">puntos</span>
      </div>

      <input
        name="lock_at"
        type="datetime-local"
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      {state?.error && (
        <p className="text-red-600 text-xs">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-green-600 text-xs">Apuesta creada.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear apuesta"}
      </button>
    </form>
  );
}