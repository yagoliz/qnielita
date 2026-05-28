"use client";

import { register } from "@/actions/auth";
import { useSearchParams } from "next/navigation";
import { useActionState, Suspense } from "react";
import { Trophy } from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await register(formData);
    },
    null
  );

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">
          Qnielita <Trophy className="size-6 text-green-600 inline" />
        </h1>
        <p className="text-gray-500">
          Necesitas un enlace de invitación para registrarte.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mb-2">
        Qnielita <Trophy className="size-6 text-green-600 inline" />
      </h1>
      <p className="text-gray-500 text-center mb-6">Crea tu cuenta</p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium mb-1"
          >
            Usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="nombre_de_usuario"
          />
          <p className="text-xs text-gray-400 mt-1">
            Letras, números y guiones bajos (3-20 caracteres)
          </p>
        </div>

        <div>
          <label
            htmlFor="display_name"
            className="block text-sm font-medium mb-1"
          >
            Nombre
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
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
          {pending ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}