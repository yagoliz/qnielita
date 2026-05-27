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
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3"
    >
      <input type="hidden" name="category" value={config.category} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-sm">{config.label}</span>
        <span className="text-xs text-gray-400 shrink-0">{config.points_value} pts</span>
      </div>
      <div className="flex gap-2">
        <input
          name="correct_answer"
          type="text"
          defaultValue={config.correct_answer ?? ""}
          placeholder="Respuesta..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {config.correct_answer ? "Actualizar" : "Resolver"}
        </button>
      </div>
      {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-xs">Apuesta resuelta.</p>}
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