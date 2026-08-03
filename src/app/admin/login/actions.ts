"use server";

import { createClient } from "@/lib/supabase/server";

const MAX_ATTEMPTS = 5;

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data: attemptCount, error: rpcError } = await supabase.rpc("record_login_attempt", {
    p_email: email,
  });
  if (rpcError) {
    console.error(rpcError);
    return { error: "Something went wrong. Please try again." };
  }
  if (attemptCount > MAX_ATTEMPTS) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(error);
    return { error: "Invalid email or password." };
  }

  return { success: true };
}
