"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuthSession } from "@/hooks/use-auth-session";

export default function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { session, loading, hasSupabaseEnv } = useAuthSession();

  useEffect(() => {
    if (!loading && (!hasSupabaseEnv || !session)) {
      router.replace("/auth");
    }
  }, [hasSupabaseEnv, loading, router, session]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-zinc-300">Загрузка...</main>;
  }

  if (!session) {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
