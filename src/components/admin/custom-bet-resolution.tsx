"use client";

import { deleteCustomBet, resolveCustomBet } from "@/actions/admin";
import { SearchCombobox, type ComboboxItem } from "@/components/search-combobox";
import { useActionState, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

type CustomBet = {
  id: string;
  question: string;
  bet_type: "yes_no" | "multiple_choice" | "open_text" | "team" | "player";
  options: string[] | null;
  points_value: number;
  lock_at: string;
  correct_answer_text: string | null;
  correct_answer_team_id: number | null;
  correct_answer_player_id: string | null;
};

function DeleteCustomBetButton({ betId }: { betId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    startTransition(async () => {
      const result = await deleteCustomBet(betId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={confirming ? "Confirmar eliminación" : "Eliminar apuesta"}
        title={confirming ? "Pulsa de nuevo para confirmar" : "Eliminar apuesta"}
        className={`shrink-0 p-1.5 rounded-md disabled:opacity-50 ${
          confirming
            ? "text-white bg-red-600 hover:bg-red-700"
            : "text-red-600 hover:text-red-800 hover:bg-red-50"
        }`}
      >
        <Trash2 className="size-4" />
      </button>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </>
  );
}

function getExistingCorrectId(bet: CustomBet): string | null {
  if (bet.bet_type === "team" && bet.correct_answer_team_id != null) {
    return String(bet.correct_answer_team_id);
  }
  if (bet.bet_type === "player" && bet.correct_answer_player_id != null) {
    return bet.correct_answer_player_id;
  }
  return null;
}

function SingleCustomBetForm({
  bet,
  teams,
  players,
}: {
  bet: CustomBet;
  teams: ComboboxItem[];
  players: ComboboxItem[];
}) {
  const isTyped = bet.bet_type === "team" || bet.bet_type === "player";
  const [selectedId, setSelectedId] = useState<string | null>(getExistingCorrectId(bet));

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await resolveCustomBet(formData);
    },
    null
  );

  const isLocked = new Date(bet.lock_at) <= new Date();
  const hasCorrectAnswer =
    bet.correct_answer_text != null ||
    bet.correct_answer_team_id != null ||
    bet.correct_answer_player_id != null;

  return (
    <form
      action={formAction}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3"
    >
      <input type="hidden" name="bet_id" value={bet.id} />
      <input type="hidden" name="bet_type" value={bet.bet_type} />
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-sm flex-1">{bet.question}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{bet.points_value} pts</span>
          <DeleteCustomBetButton betId={bet.id} />
        </div>
      </div>

      {!isLocked && (
        <p className="text-xs text-amber-600">
          Aún no se ha bloqueado — los usuarios pueden seguir respondiendo.
        </p>
      )}

      {bet.bet_type === "yes_no" && (
        <select
          name="correct_answer_text"
          defaultValue={bet.correct_answer_text ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>Selecciona respuesta...</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
        </select>
      )}

      {bet.bet_type === "multiple_choice" && bet.options && (
        <select
          name="correct_answer_text"
          defaultValue={bet.correct_answer_text ?? ""}
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
          name="correct_answer_text"
          type="text"
          defaultValue={bet.correct_answer_text ?? ""}
          placeholder="Respuesta..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      )}

      {isTyped && (
        <SearchCombobox
          items={bet.bet_type === "team" ? teams : players}
          value={selectedId}
          onChange={setSelectedId}
          placeholder={bet.bet_type === "team" ? "Buscar equipo..." : "Buscar jugador..."}
          name={bet.bet_type === "team" ? "correct_answer_team_id" : "correct_answer_player_id"}
        />
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Guardando..." : hasCorrectAnswer ? "Actualizar" : "Resolver"}
      </button>

      {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-xs">Apuesta resuelta.</p>}
    </form>
  );
}

export function CustomBetResolution({
  bets,
  teams,
  players,
}: {
  bets: CustomBet[];
  teams: ComboboxItem[];
  players: ComboboxItem[];
}) {
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
        <SingleCustomBetForm key={bet.id} bet={bet} teams={teams} players={players} />
      ))}
    </div>
  );
}