"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { logout } from "@/actions/auth";
import { Check } from "lucide-react";

const emojiOptions = ["⚽", "🏆", "🥇", "🇪🇸", "🇦🇷", "🇧🇷", "🇫🇷", "🇩🇪", "🦁", "🐐", "🔥", "⭐"];

export default function PerfilPage() {
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
        .select("display_name, avatar_emoji")
        .eq("id", user.id)
        .single();
      if (data) {
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
