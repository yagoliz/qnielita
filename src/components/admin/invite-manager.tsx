"use client";

import { generateInvite } from "@/actions/admin";
import { useState } from "react";

type Invite = {
  id: string;
  token: string;
  used_by: string | null;
  created_at: string;
};

export function InviteManager({ invites }: { invites: Invite[] }) {
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const result = await generateInvite();
    if (result.token) setNewToken(result.token);
    setLoading(false);
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Generando..." : "Generar enlace de invitación"}
      </button>

      {newToken && (
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-green-700 mb-1">Nuevo enlace:</p>
          <p className="text-xs font-mono break-all select-all">
            {baseUrl}/registro?token={newToken}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-xs"
          >
            <p className="font-mono truncate">{invite.token}</p>
            <p className="text-gray-400 mt-1">
              {invite.used_by ? "✅ Utilizado" : "⏳ Pendiente"} —{" "}
              {new Date(invite.created_at).toLocaleDateString("es")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
