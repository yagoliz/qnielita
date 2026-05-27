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

  return (
    <div>
      <div className="flex gap-1 bg-gray-50 rounded-lg p-1 mb-4">
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

      {tab === "group" ? (
        <GroupStageResults matches={groupMatches} />
      ) : (
        <KnockoutStageResults matches={knockoutMatches} />
      )}
    </div>
  );
}