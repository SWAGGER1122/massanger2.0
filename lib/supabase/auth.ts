import { supabaseClient } from "@/lib/supabase/client";

export async function signUpWithEmail(email: string, password: string) {
  if (!supabaseClient) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  return supabaseClient.auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabaseClient) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  return supabaseClient.auth.signInWithPassword({ email, password });
}

export async function signInWithPhone(phone: string) {
  if (!supabaseClient) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  return supabaseClient.auth.signInWithOtp({ phone });
}

export async function signOut() {
  if (!supabaseClient) {
    return { error: new Error("Supabase is not configured") };
  }

  return supabaseClient.auth.signOut();
}

export async function getSession() {
  if (!supabaseClient) {
    return { data: { session: null }, error: new Error("Supabase is not configured") };
  }

  return supabaseClient.auth.getSession();
}
