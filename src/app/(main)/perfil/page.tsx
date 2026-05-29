"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useActionState } from "react";
import { logout, changePassword } from "@/actions/auth";
import { Check } from "lucide-react";

const emojiOptions = ["⚽", "🏆", "🥇", "🇪🇸", "🇦🇷", "🇧🇷", "🇫🇷", "🇩🇪", "🦁", "🐐", "🔥", "⭐"];

export default function PerfilPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("⚽");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_emoji")
        .eq("id", user.id)
        .single();
      if (data) {
        setUsername(data.username);
        setDisplayName(data.display_name);
        setAvatar(data.avatar_emoji);
      }
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ display_name: displayName, avatar_emoji: avatar })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Perfil</h1>

      <div>
        <label className="block text-sm font-medium mb-1">Usuario</label>
        <input
          type="text"
          value={username}
          readOnly
          disabled
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Avatar</label>
        <div className="flex flex-wrap gap-2">
          {emojiOptions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setAvatar(emoji)}
              className={`w-10 h-10 text-xl rounded-lg border-2 ${
                avatar === emoji
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-green-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
      >
        {saving ? "Guardando..." : saved ? <><Check className="size-4 inline mr-0.5" /> Guardado</> : "Guardar cambios"}
      </button>

      <ChangePasswordForm />

      <form action={logout}>
        <button
          type="submit"
          className="w-full text-red-600 border border-red-200 rounded-lg py-2 text-sm font-medium"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await changePassword(formData);
    },
    null
  );

  return (
    <div className="border-t border-gray-200 pt-4">
      <h2 className="text-sm font-medium mb-2">Cambiar contraseña</h2>
      <form action={formAction} className="space-y-2">
        <input
          name="new_password"
          type="password"
          required
          minLength={6}
          placeholder="Nueva contraseña"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {state?.error && (
          <p className="text-red-600 text-xs">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-green-600 text-xs">Contraseña actualizada</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Actualizando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
