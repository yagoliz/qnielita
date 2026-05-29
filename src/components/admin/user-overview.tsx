"use client";

import { useState } from "react";
import {
  toggleUserAdmin,
  updateUserProfile,
  removeUser,
  adminChangePassword,
} from "@/actions/admin";

export type UserWithStats = {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  is_admin: boolean;
  created_at: string;
  rank: number | null;
  total_points: number | null;
  predictions_count: number;
};

export function UserOverview({
  users,
  currentUserId,
}: {
  users: UserWithStats[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-3">
      {users.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No hay usuarios
        </p>
      )}
      {users.map((u) => (
        <UserCard key={u.id} user={u} isSelf={u.id === currentUserId} />
      ))}
    </div>
  );
}

function UserCard({ user, isSelf }: { user: UserWithStats; isSelf: boolean }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleAdmin() {
    setLoading(true);
    setError(null);
    const result = await toggleUserAdmin(user.id);
    if (result.error) setError(result.error);
    setLoading(false);
  }

  async function handleRemove() {
    setLoading(true);
    setError(null);
    const result = await removeUser(user.id);
    if (result.error) {
      setError(result.error);
      setConfirmingDelete(false);
    }
    setLoading(false);
  }

  if (editing) {
    return (
      <EditUserCard
        user={user}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  const joinDate = new Date(user.created_at).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{user.avatar_emoji}</span>
        <span className="text-sm font-medium">{user.display_name}</span>
        {user.is_admin && (
          <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
            Admin
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-2">
        @{user.username} · Desde {joinDate}
      </p>

      <div className="flex gap-3 text-xs text-gray-500 mb-3">
        <span>#{user.rank ?? "—"} ranking</span>
        <span>{user.total_points ?? 0} pts</span>
        <span>{user.predictions_count} pronósticos</span>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {confirmingDelete ? (
        <div className="flex gap-2">
          <p className="text-xs text-red-600 flex-1">
            ¿Eliminar a {user.display_name}?
          </p>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="text-xs font-medium text-red-600 disabled:opacity-50"
          >
            Confirmar
          </button>
          <button
            onClick={() => setConfirmingDelete(false)}
            className="text-xs font-medium text-gray-500"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded"
          >
            Editar
          </button>
          {!isSelf && (
            <>
              <button
                onClick={handleToggleAdmin}
                disabled={loading}
                className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded disabled:opacity-50"
              >
                {user.is_admin ? "Quitar admin" : "Hacer admin"}
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded"
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EditUserCard({
  user,
  onCancel,
  onSaved,
}: {
  user: UserWithStats;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [avatarEmoji, setAvatarEmoji] = useState(user.avatar_emoji);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    const result = await updateUserProfile(user.id, {
      display_name: displayName,
      avatar_emoji: avatarEmoji,
    });
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSaved();
    }
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    setPasswordMsg(null);
    const result = await adminChangePassword(user.id, newPassword);
    if (result.error) {
      setError(result.error);
    } else {
      setNewPassword("");
      setPasswordMsg("Contraseña actualizada");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
      <div className="space-y-2 mb-3">
        <div>
          <label className="text-xs text-gray-500">Usuario</label>
          <input
            type="text"
            value={user.username}
            readOnly
            disabled
            className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1 text-sm text-gray-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Nombre</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Emoji</label>
          <input
            type="text"
            value={avatarEmoji}
            onChange={(e) => setAvatarEmoji(e.target.value)}
            className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Nueva contraseña</label>
          <div className="flex gap-1">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mín. 6 caracteres"
              minLength={6}
              className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
            />
            <button
              onClick={handleChangePassword}
              disabled={loading || !newPassword}
              className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded disabled:opacity-50"
            >
              Cambiar
            </button>
          </div>
          {passwordMsg && (
            <p className="text-xs text-green-600 mt-0.5">{passwordMsg}</p>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-xs font-medium text-white bg-green-600 px-3 py-1 rounded disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
        <button
          onClick={onCancel}
          className="text-xs font-medium text-gray-500 px-3 py-1"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
