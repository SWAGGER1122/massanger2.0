"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, Check } from "lucide-react";
import { VoiceMessagePlayer } from "@/components/chat/voice-message-player";
import { UseChatReturn } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

interface MessageListProps {
  chatState: UseChatReturn;
}

function StatusIcon({ status }: { status: "sent" | "delivered" | "read" }) {
  if (status === "read") {
    return <CheckCheck size={14} className="text-sky-300" />;
  }

  if (status === "delivered") {
    return <CheckCheck size={14} className="text-zinc-300" />;
  }

  return <Check size={14} className="text-zinc-400" />;
}

export function MessageList({ chatState }: MessageListProps) {
  const { activeMessages, activeChat, currentUserId } = chatState;

  return (
    <div className="glass-panel flex h-full flex-col rounded-3xl p-4">
      <div className="mb-4 border-b border-white/10 pb-4">
        <h1 className="text-lg font-semibold">{activeChat?.title ?? "Выберите чат"}</h1>
        <p className="text-sm text-zinc-400">Мгновенные сообщения и звонки</p>
      </div>

      <div className="flex-1 space-y-3 overflow-auto pr-1">
        <AnimatePresence initial={false}>
          {activeMessages.map((message) => {
            const isMine = message.senderId === currentUserId;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl border px-3 py-2",
                    isMine ? "border-sky-400/40 bg-sky-500/20" : "border-white/10 bg-white/5"
                  )}
                >
                  {message.kind === "voice" ? (
                    <div className="flex flex-col gap-1 text-sm text-zinc-100">
                      <VoiceMessagePlayer url={message.voiceUrl ?? ""} durationSec={message.durationSec} />
                      <audio controls src={message.voiceUrl ?? ""} className="w-full" />
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-100">{message.content}</p>
                  )}

                  <div className="mt-1 flex items-center justify-end gap-1 text-xs text-zinc-400">
                    <span>{new Date(message.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                    {isMine ? <StatusIcon status={message.status} /> : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
