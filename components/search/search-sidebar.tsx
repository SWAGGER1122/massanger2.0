"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SearchUserItem {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export function SearchSidebar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SearchUserItem[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>("");

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);
  const empty = hasQuery && !loading && users.length === 0;

  async function runSearch(nextQuery: string) {
    setQuery(nextQuery);
    if (!supabaseClient) {
      setUsers([]);
      return;
    }

    const normalized = nextQuery.trim();
    if (!normalized) {
      setUsers([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabaseClient.rpc("search_users", { search_query: normalized });
    if (error) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers(((data as SearchUserItem[]) ?? []).filter((user) => user?.id));
    setLoading(false);
  }

  async function openConversation(user: SearchUserItem) {
    if (!supabaseClient) {
      return;
    }

    setActiveUserId(user.id);
    const { data } = await supabaseClient.rpc("get_or_create_conversation", { participant_id: user.id });
    const chatId = typeof data === "string" ? data : Array.isArray(data) ? String(data[0] ?? "") : String(data ?? "");
    if (!chatId) {
      setActiveUserId("");
      return;
    }

    setOpen(false);
    setUsers([]);
    setQuery("");
    router.push(
      `/chats?chatId=${encodeURIComponent(chatId)}&peerName=${encodeURIComponent(user.full_name ?? user.username ?? "New chat")}&peerUsername=${encodeURIComponent(user.username ?? "")}&peerAvatar=${encodeURIComponent(user.avatar_url ?? "")}`
    );
  }

  return (
    <aside className="glass-panel h-full rounded-3xl p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Поиск</h2>
        <button onClick={() => setOpen((prev) => !prev)} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-300">
          {open ? <X size={14} /> : <Search size={14} />}
        </button>
      </div>

      <label className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <Search size={16} className="text-zinc-400" />
        <input
          value={query}
          onChange={(event) => {
            void runSearch(event.target.value);
          }}
          placeholder="Найти пользователя"
          className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
        />
      </label>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="max-h-[70vh] space-y-2 overflow-auto rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center py-6 text-zinc-300">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : null}

            {!loading &&
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    void openConversation(user);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-left transition hover:bg-white/10",
                    activeUserId === user.id && "bg-gradient-to-r from-blue-500/20 to-transparent"
                  )}
                >
                  {user.avatar_url ? (
                    <div className="h-9 w-9 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${user.avatar_url}')` }} />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <UserRound size={16} className="text-zinc-300" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-zinc-100">{user.full_name ?? "Без имени"}</p>
                    <p className="text-xs text-zinc-400">@{user.username ?? "unknown"}</p>
                  </div>
                </button>
              ))}

            {empty ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-6 text-center text-sm text-zinc-400">
                <p className="mb-1 text-xl">😞</p>
                <p>Пользователь не найден</p>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </aside>
  );
}
