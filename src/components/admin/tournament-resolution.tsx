"use client";

import { resolveTournamentBet } from "@/actions/admin";
import { useActionState } from "react";

type Config = {
  category: string;
  label: string;
  points_value: number;
  correct_answer: string | null;
};

function SingleResolutionForm({ config }: { config: Config }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await resolveTournamentBet(formData);
    },
    null
  );

  return (
    <form
      action={formAction}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
    >
      <input type="hidden" name="category" value={config.category} />
      <div className="flex items-center justify-between gap-2 text-sm">
        <div>
          <span className="font-medium">{config.label}</span>
          <span className="text-xs text-gray-400 ml-1">({config.points_value} pts)</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            name="correct_answer"
            type="text"
            defaultValue={config.correct_answer ?? ""}
            placeholder="Respuesta..."
            className="w-36 h-8 border rounded px-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded font-medium disabled:opacity-50"
          >
            {config.correct_answer ? "Actualizar" : "Resolver"}
          </button>
        </div>
      </div>
      {state?.error && <p className="text-red-600 text-xs mt-1">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-xs mt-1">Apuesta resuelta.</p>}
    </form>
  );
}

export function TournamentResolution({ configs }: { configs: Config[] }) {
  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <SingleResolutionForm key={config.category} config={config} />
      ))}
    </div>
  );
}