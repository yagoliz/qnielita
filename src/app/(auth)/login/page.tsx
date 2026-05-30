"use client";

import { login } from "@/actions/auth";
import { useActionState } from "react";
import { Trophy } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await login(formData);
    },
    null
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mb-2 flex items-center justify-center gap-2">
        Qnielita <Trophy className="size-6 text-green-600" />
      </h1>
      <p className="text-gray-500 text-center mb-6">Porra Mundial 2026</p>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {state?.error && (
          <p className="text-red-600 text-sm">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/reglas" className="font-medium text-green-700 hover:text-green-800">
          ¿Cómo funciona? Reglas y puntuación
        </Link>
      </p>
    </div>
  );
}