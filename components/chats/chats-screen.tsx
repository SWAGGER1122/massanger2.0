"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CallModal } from "@/components/call/call-modal";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList } from "@/components/chat/message-list";
import { ChatList } from "@/components/sidebar/chat-list";
import { useAgoraCall } from "@/hooks/use-agora-call";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

export function ChatsScreen() {
  const chatState = useChat();
  const { chats, upsertChat, setActiveChatId, currentUserId } = chatState;
  const searchParams = useSearchParams();
  const [callOpen, setCallOpen] = useState(false);
  const [callKind, setCallKind] = useState<"audio" | "video">("audio");
  const agora = useAgoraCall();
  const chatIdFromQuery = searchParams.get("chatId");
  const peerName = searchParams.get("peerName");
  const peerUsername = searchParams.get("peerUsername");
  const peerAvatar = searchParams.get("peerAvatar");

  useEffect(() => {
    if (!chatIdFromQuery) {
      return;
    }

    const exists = chats.some((chat) => chat.id === chatIdFromQuery);
    if (!exists) {
      upsertChat({
        id: chatIdFromQuery,
        title: peerName || peerUsername || "New chat",
        isGroup: false,
        isArchived: false,
        avatarUrl: peerAvatar || null,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
        lastMessage: null,
        participants: [
          { id: currentUserId, username: "you", avatarUrl: null, presence: "online" },
          {
            id: `peer-${chatIdFromQuery}`,
            username: peerUsername || "user",
            avatarUrl: peerAvatar || null,
            presence: "offline"
          }
        ]
      });
    }

    setActiveChatId(chatIdFromQuery);
  }, [chatIdFromQuery, chats, currentUserId, peerAvatar, peerName, peerUsername, setActiveChatId, upsertChat]);

  const isThreadVisible = Boolean(chatState.activeChatId);

  return (
    <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[320px_1fr] md:gap-4">
      <div className={cn("min-h-0", isThreadVisible ? "hidden md:block" : "block")}>
        <ChatList chatState={chatState} />
      </div>

      <section className={cn("min-h-0 flex-col", isThreadVisible ? "flex" : "hidden md:flex")}>
        <div className="mb-2 flex items-center gap-2 md:hidden">
          <button
            onClick={() => setActiveChatId("")}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-300"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="text-sm text-zinc-300">{chatState.activeChat?.title ?? "Чат"}</p>
        </div>

        <motion.div
          key={chatState.activeChatId}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-0"
        >
          <MessageList chatState={chatState} />
        </motion.div>
        <MessageInput
          chatState={chatState}
          onOpenCall={(kind) => {
            setCallKind(kind);
            setCallOpen(true);
            void agora
              .startCall({
                channel: `${chatState.activeChatId}-${kind}`,
                uid: chatState.currentUserId,
                kind
              })
              .catch(() => {
                setCallOpen(false);
              });
          }}
        />
      </section>

      <CallModal
        open={callOpen}
        kind={callKind}
        contactName={chatState.activeChat?.title ?? "Unknown"}
        connected={agora.connected}
        muted={agora.muted}
        cameraOff={agora.cameraOff}
        canUseAgora={agora.canUseAgora}
        onVideoContainerChange={agora.setVideoContainer}
        onToggleMute={() => {
          void agora.toggleMute();
        }}
        onToggleCamera={() => {
          void agora.toggleCamera();
        }}
        onClose={() => {
          void agora.endCall();
          setCallOpen(false);
        }}
      />
    </div>
  );
}
