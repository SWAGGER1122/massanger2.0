"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { UseChatReturn } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

interface ChatListProps {
  chatState: UseChatReturn;
  onSelectChat?: () => void;
}

export function ChatList({ chatState, onSelectChat }: ChatListProps) {
  const { filteredActiveChats, filteredArchivedChats, activeChatId, setActiveChatId, search, setSearch } = chatState;
  const [menu, setMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasArchived = useMemo(() => filteredArchivedChats.length > 0, [filteredArchivedChats.length]);

  function closeMenu() {
    setMenu(null);
  }

  function renderChatButton(chatId: string, title: string, unreadCount: number, lastMessage: string, presence: "online" | "away" | "offline") {
    return (
      <motion.button
        key={chatId}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        onClick={() => {
          setActiveChatId(chatId);
          onSelectChat?.();
          closeMenu();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          setMenu({ chatId, x: event.clientX, y: event.clientY });
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "touch") {
            return;
          }
          longPressRef.current = setTimeout(() => {
            setMenu({ chatId, x: event.clientX, y: event.clientY });
          }, 500);
        }}
        onPointerUp={() => {
          if (longPressRef.current) {
            clearTimeout(longPressRef.current);
          }
        }}
        onPointerLeave={() => {
          if (longPressRef.current) {
            clearTimeout(longPressRef.current);
          }
        }}
        className={cn(
          "w-full rounded-2xl border p-3 text-left transition",
          activeChatId === chatId ? "border-sky-400/50 bg-sky-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"
        )}
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="font-medium text-zinc-100">{title}</p>
          {unreadCount > 0 ? <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-medium text-white">{unreadCount}</span> : null}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <p className="truncate text-zinc-400">{lastMessage}</p>
          <span
            className={cn(
              "h-2.5 w-2.5 shrink-0 rounded-full",
              presence === "online" ? "bg-emerald-400" : presence === "away" ? "bg-amber-400" : "bg-zinc-500"
            )}
          />
        </div>
      </motion.button>
    );
  }

  return (
    <aside onClick={closeMenu} className="glass-panel relative flex h-full w-full max-w-none flex-col rounded-3xl p-4 md:max-w-[340px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chats</h2>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-300">{filteredActiveChats.length}</span>
      </div>

      <label className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-zinc-300">
        <Search size={16} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск чатов"
          className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
        />
      </label>

      <div className="space-y-2 overflow-auto">
        <AnimatePresence initial={false}>
          {hasArchived ? (
            <motion.div
              key="archive-section"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-1 rounded-2xl border border-white/10 bg-slate-900/40 p-2 backdrop-blur-md"
            >
              <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Архив</p>
              <div className="space-y-2">
                {filteredArchivedChats.map((chat) => {
                  const peer = chat.participants.find((participant) => participant.id !== chatState.currentUserId);
                  return renderChatButton(
                    chat.id,
                    chat.title,
                    chat.unreadCount,
                    chat.lastMessage?.content ?? "Нет сообщений",
                    peer?.presence ?? "offline"
                  );
                })}
              </div>
            </motion.div>
          ) : null}

          {filteredActiveChats.map((chat) => {
            const peer = chat.participants.find((participant) => participant.id !== chatState.currentUserId);
            return renderChatButton(
              chat.id,
              chat.title,
              chat.unreadCount,
              chat.lastMessage?.content ?? "Нет сообщений",
              peer?.presence ?? "offline"
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {menu ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            style={{ top: menu.y, left: menu.x }}
            className="fixed z-50 min-w-44 rounded-2xl border border-white/15 bg-slate-900/60 p-2 backdrop-blur-md"
          >
            <button
              onClick={() => {
                const target = chatState.chats.find((chat) => chat.id === menu.chatId);
                void chatState.setChatArchived(menu.chatId, !target?.isArchived);
                closeMenu();
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/10"
            >
              {chatState.chats.find((chat) => chat.id === menu.chatId)?.isArchived ? "Вернуть из архива" : "Архивировать"}
            </button>
            <button
              onClick={() => {
                void chatState.deleteChat(menu.chatId);
                closeMenu();
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-500/20"
            >
              Удалить чат
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </aside>
  );
}
