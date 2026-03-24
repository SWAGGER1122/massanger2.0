"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MessageCircle, Search, UserRound } from "lucide-react";
import { ReactNode } from "react";
import { signOut } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
}

const navItems = [
  { href: "/chats", label: "Чаты", icon: MessageCircle },
  { href: "/search", label: "Поиск", icon: Search },
  { href: "/profile", label: "Профиль", icon: UserRound }
];

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <main className="h-screen overflow-hidden p-4">
      <div className="grid h-full grid-cols-[220px_1fr] gap-4">
        <aside className="glass-panel flex flex-col rounded-3xl p-4">
          <h2 className="mb-4 text-lg font-semibold">Messenger</h2>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
                    active ? "border-sky-400/50 bg-sky-500/20 text-white" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => {
              void signOut().then(() => {
                router.replace("/auth");
              });
            }}
            className="mt-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </aside>

        <section className="min-h-0">{children}</section>
      </div>
    </main>
  );
}
