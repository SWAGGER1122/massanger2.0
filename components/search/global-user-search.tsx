"use client";

import { Search, UserRound } from "lucide-react";
import { UseChatReturn } from "@/hooks/use-chat";

interface GlobalUserSearchProps {
  chatState: UseChatReturn;
}

export function GlobalUserSearch({ chatState }: GlobalUserSearchProps) {
  const hasQuery = chatState.globalSearch.trim().length > 0;

  return (
    <div className="glass-panel mb-3 rounded-2xl p-3">
      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <Search size={16} className="text-zinc-400" />
        <input
          value={chatState.globalSearch}
          onChange={(event) => chatState.setGlobalSearch(event.target.value)}
          placeholder="Глобальный поиск пользователей"
          className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
        />
      </label>

      {hasQuery ? (
        <div className="mt-2 max-h-44 space-y-2 overflow-auto">
          {chatState.globalResults.map((user) => (
            <button
              key={user.id}
              className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
            >
              <UserRound size={16} className="text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-100">{user.fullName ?? user.username}</p>
                <p className="text-xs text-zinc-400">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
