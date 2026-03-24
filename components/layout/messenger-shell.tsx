"use client";

import { useState } from "react";
import { ChatList } from "@/components/sidebar/chat-list";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList } from "@/components/chat/message-list";
import { ProfilePanel } from "@/components/profile/profile-panel";
import { CallModal } from "@/components/call/call-modal";
import { GlobalUserSearch } from "@/components/search/global-user-search";
import { useAgoraCall } from "@/hooks/use-agora-call";
import { useChat } from "@/hooks/use-chat";
import { useTheme } from "@/hooks/use-theme";

export function MessengerShell() {
  const chatState = useChat();
  const { theme, setTheme } = useTheme();
  const [callOpen, setCallOpen] = useState(false);
  const [callKind, setCallKind] = useState<"audio" | "video">("audio");
  const agora = useAgoraCall();

  const contactName = chatState.activeChat?.title ?? "Unknown";

  return (
    <>
      <main className="h-screen overflow-hidden p-4">
        <div className="grid h-full grid-cols-[320px_1fr_300px] gap-4">
          <ChatList chatState={chatState} />

          <section className="flex min-h-0 flex-col">
            <GlobalUserSearch chatState={chatState} />
            <MessageList chatState={chatState} />
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

          <ProfilePanel
            chatState={chatState}
            theme={theme}
            onThemeChange={(nextTheme) => {
              setTheme(nextTheme);
            }}
          />
        </div>
      </main>

      <CallModal
        open={callOpen}
        kind={callKind}
        contactName={contactName}
        connected={agora.connected}
        muted={agora.muted}
        cameraOff={agora.cameraOff}
        canUseAgora={agora.canUseAgora}
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
    </>
  );
}
