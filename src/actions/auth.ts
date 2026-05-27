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

  const adminClient = createAdminClient();
  const normalizedEmail = email.toLowerCase().trim();

  const { data: invite, error: checkError } = await adminClient
    .from("invites")
    .select("id, allowed_emails, used_by")
    .eq("token", token)
    .single();

  if (checkError || !invite) {
    return { error: "Enlace de invitación no válido o ya utilizado." };
  }

  const isEmailRestricted = invite.allowed_emails && invite.allowed_emails.length > 0;

  if (isEmailRestricted) {
    if (!invite.allowed_emails!.includes(normalizedEmail)) {
      return { error: "Este enlace no es válido para tu correo." };
    }
    const { count } = await adminClient
      .from("invite_claims")
      .select("id", { count: "exact", head: true })
      .eq("invite_id", invite.id);
    if ((count ?? 0) >= invite.allowed_emails!.length) {
      return { error: "Todas las invitaciones de este enlace ya fueron utilizadas." };
    }
  } else {
    if (invite.used_by) {
      return { error: "Enlace de invitación no válido o ya utilizado." };
    }
  }

  const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (isEmailRestricted) {
    const { error: claimError } = await adminClient
      .from("invite_claims")
      .insert({ invite_id: invite.id, user_id: authData.user.id });

    if (claimError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { error: "Enlace de invitación no válido o ya utilizado." };
    }
  } else {
    const { data: claimed, error: claimError } = await adminClient
      .from("invites")
      .update({ used_by: authData.user.id })
      .eq("id", invite.id)
      .is("used_by", null)
      .select("id")
      .single();

    if (claimError || !claimed) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { error: "Enlace de invitación no válido o ya utilizado." };
    }
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

  redirect("/inicio");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}