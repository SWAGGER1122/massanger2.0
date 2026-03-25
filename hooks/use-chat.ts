"use client";

import { useEffect, useMemo, useState } from "react";
import { chats as initialChats, messagesByChatId, users } from "@/lib/mock-data";
import { hasSupabaseEnv, supabaseClient } from "@/lib/supabase/client";
import { ChatSummary, Message, UserProfile } from "@/types/chat";

function upsertMessage(messages: Message[], incoming: Message) {
  const existingIndex = messages.findIndex((message) => message.id === incoming.id);
  if (existingIndex >= 0) {
    const updated = [...messages];
    updated[existingIndex] = incoming;
    return updated;
  }

  return [...messages, incoming];
}

function dedupeChatsById(chats: ChatSummary[]) {
  const seen = new Set<string>();
  const unique: ChatSummary[] = [];

  for (const chat of chats) {
    if (seen.has(chat.id)) {
      continue;
    }
    seen.add(chat.id);
    unique.push(chat);
  }

  return unique;
}

function mapDbRowToMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    chatId: String(row.chat_id),
    senderId: String(row.sender_id),
    content: String(row.content ?? ""),
    kind: ((row.message_type as "text" | "voice") ?? (row.kind as "text" | "voice")) ?? "text",
    voiceUrl: (row.voice_url as string | null) ?? null,
    durationSec: (row.duration_sec as number | null) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    editedAt: (row.edited_at as string | null) ?? null,
    status: "sent"
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function useChat() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentUserIdState, setCurrentUserIdState] = useState("");

  useEffect(() => {
    if (!supabaseClient || !hasSupabaseEnv) {
      return;
    }

    void supabaseClient.auth.getUser().then(({ data }) => {
      if (data.user?.id) {
        setCurrentUserIdState(data.user.id);
      }
    });
  }, []);

  // Загрузка реальных чатов из Supabase
  useEffect(() => {
    if (!currentUserIdState || !supabaseClient || !hasSupabaseEnv) {
      return;
    }

    async function loadChats() {
      if (!supabaseClient) return;
      // Пытаемся загрузить чаты с участниками и последним сообщением
      const { data, error } = await supabaseClient
        .from("chats")
        .select(`
          *,
          chat_participants(
            user_id,
            profiles(id, username, full_name, avatar_url)
          ),
          messages(id, content, sender_id, created_at, kind)
        `)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading chats:", error.message, error.details, error.hint);
        return;
      }

      const mappedChats: ChatSummary[] = data.map((chat: any) => {
        // Сортируем сообщения локально, чтобы найти последнее
        const sortedMessages = chat.messages && chat.messages.length > 0 
          ? [...chat.messages].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          : [];
        
        const lastMsg = sortedMessages[0] || null;

        return {
          id: chat.id,
          title: chat.title || "Untitled Chat",
          isGroup: chat.is_group,
          isArchived: chat.is_archived || false,
          avatarUrl: chat.avatar_url,
          unreadCount: 0,
          updatedAt: chat.updated_at,
          lastMessage: lastMsg ? {
            id: lastMsg.id,
            content: lastMsg.kind === "voice" ? "Voice message" : lastMsg.content,
            senderId: lastMsg.sender_id,
            createdAt: lastMsg.created_at,
            kind: lastMsg.kind,
            status: "sent"
          } : null,
          participants: chat.chat_participants?.map((p: any) => ({
            id: p.profiles.id,
            username: p.profiles.username,
            avatarUrl: p.profiles.avatar_url,
            presence: "offline"
          })) || []
        };
      });

      setChats(mappedChats);
      if (mappedChats.length > 0) {
        setActiveChatId((prev) => prev || mappedChats[0].id);
      }
    }

    void loadChats();

    // Подписка на изменения в чатах (новые чаты, обновления)
    const channel = supabaseClient
      .channel("public:chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, () => {
        void loadChats();
      })
      .subscribe();

    return () => {
      if (supabaseClient) {
        void supabaseClient.removeChannel(channel);
      }
    };
  }, [currentUserIdState]);

  useEffect(() => {
    if (!activeChatId || !supabaseClient || !hasSupabaseEnv) {
      return;
    }

    const client = supabaseClient;

    const channel = client
      .channel(`realtime:messages:${activeChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${activeChatId}`
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const message = mapDbRowToMessage(row);
          setMessages((prev) => {
            const current = prev[message.chatId] ?? [];
            if (current.find((item) => item.id === message.id)) {
              return prev;
            }

            const nextByChat = [...current, message];
            return {
              ...prev,
              [message.chatId]: nextByChat
            };
          });
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === message.chatId
                ? {
                    ...chat,
                    updatedAt: message.createdAt,
                    lastMessage: {
                      id: message.id,
                      content: message.kind === "voice" ? "Voice message" : message.content,
                      senderId: message.senderId,
                      createdAt: message.createdAt,
                      kind: message.kind,
                      status: message.status
                    }
                  }
                : chat
            )
          );
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId || !supabaseClient || !hasSupabaseEnv) {
      return;
    }

    void (async () => {
      const { data, error } = await supabaseClient.from("messages").select("*").eq("chat_id", activeChatId).order("created_at", { ascending: true });
      if (error) {
        console.error(error);
        return;
      }
      if (!data) {
        return;
      }
      const mapped = (data as Record<string, unknown>[]).map(mapDbRowToMessage);
      setMessages((prev) => ({
        ...prev,
        [activeChatId]: mapped
      }));
    })();
  }, [activeChatId]);

  const normalizedChats = useMemo(() => dedupeChatsById(chats), [chats]);

  const activeChat = useMemo(() => normalizedChats.find((chat) => chat.id === activeChatId) ?? null, [activeChatId, normalizedChats]);
  const activeMessages = useMemo(() => messages[activeChatId] ?? [], [activeChatId, messages]);

  const filteredActiveChats = useMemo(
    () => normalizedChats.filter((chat) => !chat.isArchived && chat.title.toLowerCase().includes(search.toLowerCase())),
    [normalizedChats, search]
  );

  const filteredArchivedChats = useMemo(
    () => normalizedChats.filter((chat) => chat.isArchived && chat.title.toLowerCase().includes(search.toLowerCase())),
    [normalizedChats, search]
  );

  const globalResults = useMemo(
    () =>
      users.filter((user) => {
        const q = globalSearch.toLowerCase();
        return user.username.toLowerCase().includes(q) || (user.fullName ?? "").toLowerCase().includes(q);
      }),
    [globalSearch]
  );

  async function ensureProfileExists(userId: string) {
    if (!supabaseClient || !hasSupabaseEnv) {
      return;
    }

    const { data } = await supabaseClient.auth.getUser();
    const email = data.user?.email ?? null;
    const phone = data.user?.phone ?? null;
    const username = email?.split("@")[0] ?? `user_${userId.slice(0, 8)}`;

    await supabaseClient.from("profiles").upsert(
      {
        id: userId,
        email,
        phone,
        username
      },
      { onConflict: "id" }
    );
  }

  async function ensureChatExists(chatId: string, userId: string) {
    if (!supabaseClient || !hasSupabaseEnv) {
      return;
    }

    const existing = await supabaseClient.from("chats").select("id").eq("id", chatId).maybeSingle();
    if (existing.data?.id) {
      return;
    }

    const title = normalizedChats.find((chat) => chat.id === chatId)?.title ?? "Chat";

    const attempts = [
      { id: chatId, title, is_group: false, is_archived: false, created_by: userId },
      { id: chatId, title, is_group: false, is_archived: false },
      { id: chatId, title }
    ];

    for (const payload of attempts) {
      const result = await supabaseClient.from("chats").insert(payload as never);
      if (!result.error) {
        break;
      }
    }
  }

  async function ensureChatMembership(chatId: string, userId: string) {
    if (!supabaseClient || !hasSupabaseEnv) {
      return;
    }

    const memberResult = await supabaseClient
      .from("chat_members")
      .upsert({ chat_id: chatId, user_id: userId, role: "member" }, { onConflict: "chat_id,user_id" });

    if (!memberResult.error) {
      return;
    }

    await supabaseClient.from("chat_participants").upsert({ chat_id: chatId, user_id: userId }, { onConflict: "chat_id,user_id" });
  }

  async function persistMessage(message: Message) {
    if (!supabaseClient || !hasSupabaseEnv) {
      return;
    }

    const insertPayload: Record<string, unknown> = {
      chat_id: message.chatId,
      sender_id: message.senderId,
      content: message.content,
      message_type: message.kind === "voice" ? "voice" : "text"
    };

    if (message.kind === "voice") {
      insertPayload.voice_url = message.voiceUrl;
      insertPayload.duration_sec = message.durationSec;
      console.log("Saving voice message metadata", {
        chatId: message.chatId,
        senderId: message.senderId,
        voiceUrl: message.voiceUrl,
        durationSec: message.durationSec
      });
    }

    const firstAttempt = await supabaseClient.from("messages").insert(insertPayload);

    if (!firstAttempt.error) {
      if (message.kind === "voice") {
        console.log("Voice message metadata saved in messages table", { voiceUrl: message.voiceUrl });
      }
      return;
    }

    console.error("Failed to save message", firstAttempt.error);

    await ensureProfileExists(message.senderId);
    await ensureChatExists(message.chatId, message.senderId);
    await ensureChatMembership(message.chatId, message.senderId);

    const secondAttempt = await supabaseClient.from("messages").insert(insertPayload);
    if (secondAttempt.error) {
      console.error("Failed to save message after retries", secondAttempt.error);
    } else if (message.kind === "voice") {
      console.log("Voice message metadata saved in messages table after retries", { voiceUrl: message.voiceUrl });
    }
  }

  async function sendMessage(content: string) {
    if (!activeChatId || !content.trim() || !currentUserIdState) {
      return;
    }

    if (!isUuid(activeChatId)) {
      console.error(new Error(`Invalid currentChatId: ${activeChatId}`));
      return;
    }

    const message: Message = {
      id: crypto.randomUUID(),
      chatId: activeChatId,
      senderId: currentUserIdState,
      content: content.trim(),
      kind: "text",
      voiceUrl: null,
      durationSec: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      status: "sent"
    };

    await persistMessage(message);
  }

  async function sendVoiceMessage(blob: Blob, durationSec: number) {
    if (!activeChatId || !currentUserIdState) {
      return;
    }

    if (!isUuid(activeChatId)) {
      console.error(new Error(`Invalid currentChatId: ${activeChatId}`));
      return;
    }

    const extension = blob.type.includes("ogg") ? "ogg" : "webm";
    let voiceUrl = URL.createObjectURL(blob);
    const filePath = `${activeChatId}/${currentUserIdState}/${crypto.randomUUID()}.${extension}`;
    const bucketName = "media";
    console.log("Preparing voice upload", {
      bucket: bucketName,
      filePath,
      blobType: blob.type,
      blobSize: blob.size,
      durationSec
    });

    if (supabaseClient && hasSupabaseEnv) {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (!sessionData.session) {
        console.error("Voice upload blocked: no authenticated session");
        return;
      }
      try {
        console.log("Uploading voice file to storage", { bucket: bucketName, filePath });
        const uploadResult = await supabaseClient.storage.from(bucketName).upload(filePath, blob, {
          contentType: blob.type || `audio/${extension}`,
          upsert: false
        });

        if (uploadResult.error) {
          console.error("Voice upload failed", uploadResult.error);
        } else {
          const { data } = supabaseClient.storage.from(bucketName).getPublicUrl(filePath);
          voiceUrl = data.publicUrl;
          console.log("Voice upload completed", { voiceUrl });
        }
      } catch (error) {
        console.error("Voice upload exception", error);
      }
    }

    const message: Message = {
      id: crypto.randomUUID(),
      chatId: activeChatId,
      senderId: currentUserIdState,
      content: "Voice message",
      kind: "voice",
      voiceUrl,
      durationSec,
      createdAt: new Date().toISOString(),
      editedAt: null,
      status: "sent"
    };

    console.log("Persisting voice message", { chatId: message.chatId, voiceUrl: message.voiceUrl });
    await persistMessage(message);
  }

  async function setChatArchived(chatId: string, isArchived: boolean) {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, isArchived } : chat)));

    if (supabaseClient && hasSupabaseEnv) {
      await supabaseClient.from("chats").update({ is_archived: isArchived }).eq("id", chatId);
    }
  }

  async function deleteChat(chatId: string) {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    setMessages((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });

    if (activeChatId === chatId) {
      const nextChat = normalizedChats.find((chat) => chat.id !== chatId && !chat.isArchived);
      setActiveChatId(nextChat?.id ?? "");
    }

    if (supabaseClient && hasSupabaseEnv) {
      await supabaseClient.from("chats").delete().eq("id", chatId);
    }
  }

  function upsertChat(chat: ChatSummary) {
    setChats((prev) => {
      const exists = prev.some((item) => item.id === chat.id);
      if (exists) {
        return prev.map((item) => (item.id === chat.id ? { ...item, ...chat } : item));
      }
      return [chat, ...prev];
    });
  }

  return {
    chats: normalizedChats,
    activeChat,
    activeChatId,
    activeMessages,
    filteredActiveChats,
    filteredArchivedChats,
    search,
    setSearch,
    globalSearch,
    setGlobalSearch,
    globalResults,
    setActiveChatId,
    sendMessage,
    sendVoiceMessage,
    setChatArchived,
    deleteChat,
    upsertChat,
    currentUserId: currentUserIdState,
    users,
    setChats
  };
}

export type UseChatReturn = ReturnType<typeof useChat>;
export type GlobalUserResult = UserProfile;
