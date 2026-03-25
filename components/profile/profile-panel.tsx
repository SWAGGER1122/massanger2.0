"use client";

import { Settings2, ShieldCheck, UserRoundCog } from "lucide-react";
import { UseChatReturn } from "@/hooks/use-chat";

interface ProfilePanelProps {
  chatState: UseChatReturn;
  theme: "dark" | "light" | "system";
  onThemeChange: (theme: "dark" | "light" | "system") => void;
}

export function ProfilePanel({ chatState, theme, onThemeChange }: ProfilePanelProps) {
  const me = chatState.users.find((user) => user.id === chatState.currentUserId);

  return (
    <aside className="glass-panel h-full min-w-0 rounded-3xl p-4 md:min-w-[280px]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Профиль</h2>
        <p className="text-sm text-zinc-400">Настройки аккаунта и приватности</p>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 h-14 w-14 rounded-full bg-gradient-to-br from-sky-400/50 to-violet-500/50" />
        <p className="font-medium">{me?.fullName ?? me?.username}</p>
        <p className="text-sm text-zinc-400">{me?.about ?? "Добавьте описание профиля"}</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
            <Settings2 size={16} />
            Тема
          </div>
          <div className="flex gap-2">
            {(["dark", "light", "system"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onThemeChange(mode)}
                className={`rounded-xl px-3 py-1.5 text-xs transition ${
                  theme === mode ? "bg-sky-500 text-white" : "bg-white/10 text-zinc-300 hover:bg-white/15"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
            <ShieldCheck size={16} />
            Приватность
          </div>
          <p className="text-xs text-zinc-400">Кто видит ваш онлайн-статус и может звонить вам.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
            <UserRoundCog size={16} />
            Профиль
          </div>
          <p className="text-xs text-zinc-400">Смена аватара и редактирование поля «О себе».</p>
        </div>
      </div>
    </aside>
  );
}
