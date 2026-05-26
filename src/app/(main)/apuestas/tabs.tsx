"use client";

import { useState, type ReactNode } from "react";

export function ApuestasTabs({
  torneoContent,
  locasContent,
}: {
  torneoContent: ReactNode;
  locasContent: ReactNode;
}) {
  const [tab, setTab] = useState<"torneo" | "locas">("torneo");

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => setTab("torneo")}
          className={`flex-1 py-2 text-sm font-medium rounded-md ${
            tab === "torneo"
              ? "bg-white shadow-sm text-green-600"
              : "text-gray-500"
          }`}
        >
          🏆 Torneo
        </button>
        <button
          onClick={() => setTab("locas")}
          className={`flex-1 py-2 text-sm font-medium rounded-md ${
            tab === "locas"
              ? "bg-white shadow-sm text-green-600"
              : "text-gray-500"
          }`}
        >
          🎲 Locas
        </button>
      </div>

      {tab === "torneo" ? torneoContent : locasContent}
    </div>
  );
}
