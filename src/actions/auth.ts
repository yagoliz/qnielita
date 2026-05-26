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

  // Use service role client to bypass RLS and atomically claim invite
  const adminClient = createAdminClient();

  // Atomically claim the invite — prevents race condition
  const { data: invite, error: claimError } = await adminClient
    .from("invites")
    .update({ used_by: "00000000-0000-0000-0000-000000000000" })
    .eq("token", token)
    .is("used_by", null)
    .select("id")
    .single();

  if (claimError || !invite) {
    return { error: "Enlace de invitación no válido o ya utilizado." };
  }

  // Create user via service role (email signups can be disabled in Supabase dashboard)
  const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (signUpError) {
    // Release the invite claim on failure
    await adminClient
      .from("invites")
      .update({ used_by: null })
      .eq("id", invite.id);
    return { error: signUpError.message };
  }

  // Update invite with actual user ID
  await adminClient
    .from("invites")
    .update({ used_by: authData.user.id })
    .eq("id", invite.id);

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