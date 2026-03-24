"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuthSession } from "@/hooks/use-auth-session";

export default function AuthPage() {
  const router = useRouter();
  const { session, loading, hasSupabaseEnv } = useAuthSession();

  useEffect(() => {
    if (!loading && session) {
      router.replace("/chats");
    }
  }, [loading, router, session]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      {hasSupabaseEnv ? (
        <AuthForm />
      ) : (
        <div className="glass-panel w-full max-w-md rounded-3xl p-6">
          <h1 className="text-xl font-semibold">Supabase не настроен</h1>
          <p className="mt-2 text-sm text-zinc-400">Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env</p>
        </div>
      )}
    </main>
  );
}
