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
    <main className="h-screen overflow-hidden p-3 pb-20 md:p-4 md:pb-4">
      <div className="mb-3 flex items-center justify-between md:hidden">
        <h2 className="text-base font-semibold">Messenger</h2>
        <button
          onClick={() => {
            void signOut().then(() => {
              router.replace("/auth");
            });
          }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300"
        >
          Выйти
        </button>
      </div>

      <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[220px_1fr] md:gap-4">
        <aside className="glass-panel hidden flex-col rounded-3xl p-4 md:flex">
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

        <section className="min-h-0 overflow-hidden">{children}</section>
      </div>

      <nav className="glass-panel fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-2 rounded-2xl p-2 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] transition",
                active ? "border-sky-400/50 bg-sky-500/20 text-white" : "border-white/10 bg-white/5 text-zinc-300"
              )}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
