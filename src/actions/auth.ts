"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
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
  const token = formData.get("token") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;

  // Use service role client to bypass RLS
  const adminClient = createAdminClient();

  // Verify invite exists and is unused
  const { data: invite, error: checkError } = await adminClient
    .from("invites")
    .select("id")
    .eq("token", token)
    .is("used_by", null)
    .single();

  if (checkError || !invite) {
    return { error: "Enlace de invitación no válido o ya utilizado." };
  }

  // Create user via service role (email signups can be disabled in Supabase dashboard)
  // The handle_new_user trigger creates the profile row automatically.
  const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  // Atomically claim the invite with the real user ID (profile exists now, so FK is satisfied)
  const { data: claimed, error: claimError } = await adminClient
    .from("invites")
    .update({ used_by: authData.user.id })
    .eq("id", invite.id)
    .is("used_by", null)
    .select("id")
    .single();

  if (claimError || !claimed) {
    // Race condition: another registration claimed this invite first — clean up
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "Enlace de invitación no válido o ya utilizado." };
  }

  // Sign in the newly created user
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect("/inicio");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}