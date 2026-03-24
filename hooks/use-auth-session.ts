"use client";

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { getSession } from "@/lib/supabase/auth";
import { hasSupabaseEnv, supabaseClient } from "@/lib/supabase/client";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => hasSupabaseEnv && Boolean(supabaseClient));

  useEffect(() => {
    if (!hasSupabaseEnv || !supabaseClient) {
      return;
    }

    void getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, hasSupabaseEnv };
}
