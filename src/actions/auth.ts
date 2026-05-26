"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/inicio");
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const token = formData.get("token") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;

  // Validate invite token
  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .select("id, used_by")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    return { error: "Enlace de invitación no válido." };
  }

  if (invite.used_by) {
    return { error: "Este enlace de invitación ya fue utilizado." };
  }

  // Create user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  // Mark invite as used
  if (authData.user) {
    await supabase
      .from("invites")
      .update({ used_by: authData.user.id })
      .eq("id", invite.id);
  }

  redirect("/inicio");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
