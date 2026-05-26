"use client";

import { useState, type ReactNode } from "react";

export function AdminTabs({
  resultadosContent,
  apuestasContent,
  torneoContent,
  invitesContent,
  usuariosContent,
}: {
  resultadosContent: ReactNode;
  apuestasContent: ReactNode;
  torneoContent: ReactNode;
  invitesContent: ReactNode;
  usuariosContent: ReactNode;
}) {
  const [tab, setTab] = useState<
    "resultados" | "apuestas" | "torneo" | "invites" | "usuarios"
  >("resultados");

  const tabs = [
    { key: "resultados" as const, label: "Resultados" },
    { key: "apuestas" as const, label: "Locas" },
    { key: "torneo" as const, label: "Torneo" },
    { key: "invites" as const, label: "Invites" },
    { key: "usuarios" as const, label: "Usuarios" },
  ];

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-md ${
              tab === t.key
                ? "bg-white shadow-sm text-green-600"
                : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resultados" && resultadosContent}
      {tab === "apuestas" && apuestasContent}
      {tab === "torneo" && torneoContent}
      {tab === "invites" && invitesContent}
      {tab === "usuarios" && usuariosContent}
    </div>
  );
}
