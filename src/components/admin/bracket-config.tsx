"use client";

import { useActionState } from "react";
import { updateBracketConfig } from "@/actions/admin";

type Props = {
  config: {
    unlock_at: string;
    lock_at: string;
  };
};

function toLocalInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16);
}

export function BracketConfigEditor({ config }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await updateBracketConfig(formData);
    },
    null
  );

  return (
    <form action={formAction} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
      <h3 className="text-sm font-semibold text-green-600">Ventana del Bracket</h3>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Apertura (UTC)</label>
        <input
          type="datetime-local"
          name="unlock_at"
          defaultValue={toLocalInput(config.unlock_at)}
          className="w-full text-sm border rounded-md px-2 py-1.5"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Cierre (UTC)</label>
        <input
          type="datetime-local"
          name="lock_at"
          defaultValue={toLocalInput(config.lock_at)}
          className="w-full text-sm border rounded-md px-2 py-1.5"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-600 text-white text-sm rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Actualizar fechas"}
      </button>

      {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-xs">Actualizado</p>}
    </form>
  );
}
