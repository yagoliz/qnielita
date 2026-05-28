"use client";

import { useState } from "react";
import { GroupStageResults } from "./group-stage-results";
import { KnockoutStageResults } from "./knockout-stage-results";
import type { Match } from "./match-result-row";

export function ResultadosTabs({
  groupMatches,
  knockoutMatches,
}: {
  groupMatches: Match[];
  knockoutMatches: Match[];
}) {
  const [tab, setTab] = useState<"group" | "knockout">("group");
  const [overrideLock, setOverrideLock] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-50 rounded-lg p-1 flex-1">
        <button
          onClick={() => setTab("group")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md ${
            tab === "group"
              ? "bg-white shadow-sm text-green-600"
              : "text-gray-500"
          }`}
        >
          Fase de Grupos
        </button>
        <button
          onClick={() => setTab("knockout")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md ${
            tab === "knockout"
              ? "bg-white shadow-sm text-green-600"
              : "text-gray-500"
          }`}
        >
          Fase Eliminatoria
        </button>
        </div>
        <label className="flex items-center gap-1.5 ml-3 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={overrideLock}
            onChange={(e) => setOverrideLock(e.target.checked)}
            className="accent-green-600 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-gray-500">Mostrar todos</span>
        </label>
      </div>

      {tab === "group" ? (
        <GroupStageResults matches={groupMatches} overrideLock={overrideLock} />
      ) : (
        <KnockoutStageResults matches={knockoutMatches} overrideLock={overrideLock} />
      )}
    </div>
  );
}