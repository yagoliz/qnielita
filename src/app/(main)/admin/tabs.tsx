"use client";

import { useState, type ReactNode } from "react";

export function AdminTabs({
  resultadosContent,
  apuestasContent,
  torneoContent,
  bracketContent,
  invitesContent,
  usuariosContent,
}: {
  resultadosContent: ReactNode;
  apuestasContent: ReactNode;
  torneoContent: ReactNode;
  bracketContent: ReactNode;
  invitesContent: ReactNode;
  usuariosContent: ReactNode;
}) {
  const [tab, setTab] = useState<
    "resultados" | "apuestas" | "torneo" | "bracket" | "invites" | "usuarios"
  >("resultados");

  const tabs = [
    { key: "resultados" as const, label: "Resultados" },
    { key: "apuestas" as const, label: "Locas" },
    { key: "torneo" as const, label: "Torneo" },
    { key: "bracket" as const, label: "Bracket" },
    { key: "invites" as const, label: "Invites" },
    { key: "usuarios" as const, label: "Usuarios" },
  ];

  const contentMap = {
    resultados: resultadosContent,
    apuestas: apuestasContent,
    torneo: torneoContent,
    bracket: bracketContent,
    invites: invitesContent,
    usuarios: usuariosContent,
  };

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

      <div key={tab}>{contentMap[tab]}</div>
    </div>
  );
}
