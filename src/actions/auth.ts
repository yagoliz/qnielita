"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateUsername, usernameToEmail } from "@/lib/username";

export async function login(formData: FormData) {
  const username = (formData.get("username") as string).toLowerCase().trim();
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    return { error: "Usuario o contraseña incorrectos" };
  }

  redirect("/inicio");
}

export async function register(formData: FormData) {
  const token = formData.get("token") as string;
  const username = (formData.get("username") as string).toLowerCase().trim();
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;

  const usernameError = validateUsername(username);
  if (usernameError) {
    return { error: usernameError };
  }

  const adminClient = createAdminClient();

  const { data: invite, error: inviteError } = await adminClient
    .from("invites")
    .select("id, max_claims")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    return { error: "Enlace de invitación no válido" };
  }

  const { count } = await adminClient
    .from("invite_claims")
    .select("id", { count: "exact", head: true })
    .eq("invite_id", invite.id);

  if ((count ?? 0) >= invite.max_claims) {
    return { error: "Este enlace de invitación ya no tiene plazas disponibles" };
  }

  const { data: existingUser } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (existingUser) {
    return { error: "Este nombre de usuario ya está en uso" };
  }

  const email = usernameToEmail(username);
  const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, username },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const { error: claimError } = await adminClient
    .from("invite_claims")
    .insert({ invite_id: invite.id, user_id: authData.user.id });

  if (claimError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "No se pudo completar el registro. Inténtalo de nuevo." };
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect("/inicio");
}

export async function changePassword(formData: FormData) {
  const newPassword = formData.get("new_password") as string;

  if (!newPassword || newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}