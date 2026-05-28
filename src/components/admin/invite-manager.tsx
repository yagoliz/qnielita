"use client";

import { deleteInvite, generateInvite } from "@/actions/admin";
import { useState, useTransition } from "react";
import { Check, CheckCircle, Clock, Copy, Trash2 } from "lucide-react";

type Invite = {
  id: string;
  token: string;
  max_claims: number;
  created_at: string;
  claim_count: number;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copiado" : "Copiar enlace"}
      title={copied ? "Copiado" : "Copiar enlace"}
      className="shrink-0 p-1.5 rounded-md text-green-700 hover:text-green-900 hover:bg-green-50"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}

function DeleteInviteButton({ inviteId }: { inviteId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    startTransition(async () => {
      await deleteInvite(inviteId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={confirming ? "Confirmar eliminación" : "Eliminar enlace"}
      title={confirming ? "Pulsa de nuevo para confirmar" : "Eliminar enlace"}
      className={`shrink-0 p-1.5 rounded-md disabled:opacity-50 ${
        confirming
          ? "text-white bg-red-600 hover:bg-red-700"
          : "text-red-600 hover:text-red-800 hover:bg-red-50"
      }`}
    >
      <Trash2 className="size-4" />
    </button>
  );
}

export function InviteManager({ invites }: { invites: Invite[] }) {
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [maxClaims, setMaxClaims] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await generateInvite(maxClaims);
    if (result.token) {
      setNewToken(result.token);
    } else if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Número de plazas
        </label>
        <input
          type="number"
          min={1}
          value={maxClaims}
          onChange={(e) => setMaxClaims(parseInt(e.target.value, 10) || 1)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Generando..." : "Generar enlace de invitación"}
      </button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      {newToken && (
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-green-700 mb-1">Nuevo enlace:</p>
              <p className="text-xs font-mono break-all">
                {baseUrl}/registro?token={newToken}
              </p>
            </div>
            <CopyButton text={`${baseUrl}/registro?token=${newToken}`} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {invites.map((invite) => {
          const isFull = invite.claim_count >= invite.max_claims;

          return (
            <div
              key={invite.id}
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-xs ${
                isFull ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono truncate flex-1 self-center">
                  {invite.token}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {!isFull && (
                    <CopyButton
                      text={`${baseUrl}/registro?token=${invite.token}`}
                    />
                  )}
                  <DeleteInviteButton inviteId={invite.id} />
                </div>
              </div>
              <div className="text-gray-400 mt-1">
                <p>
                  {isFull ? (
                    <CheckCircle className="size-3.5 inline text-green-500" />
                  ) : (
                    <Clock className="size-3.5 inline text-gray-400" />
                  )}{" "}
                  {invite.claim_count}/{invite.max_claims} utilizado(s) —{" "}
                  {new Date(invite.created_at).toLocaleDateString("es")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}