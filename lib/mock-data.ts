import { ChatSummary, Message, UserProfile } from "@/types/chat";

export const currentUserId = "2f2b7995-4fd4-4b97-8d95-a7f37bd8b88c";

export const users: UserProfile[] = [
  {
    id: "2f2b7995-4fd4-4b97-8d95-a7f37bd8b88c",
    email: "you@example.com",
    phone: null,
    username: "you",
    fullName: "You",
    avatarUrl: null,
    about: "Building the future messenger",
    isPrivate: false,
    lastSeenAt: null,
    presence: "online"
  },
  {
    id: "cb628d22-8a2a-4890-8834-7b4b3f18b314",
    email: "alexa@example.com",
    phone: null,
    username: "alexa",
    fullName: "Alexa Reed",
    avatarUrl: null,
    about: "Designing interfaces",
    isPrivate: false,
    lastSeenAt: null,
    presence: "online"
  },
  {
    id: "be4f3641-c6ac-4256-a622-f37514c8a0a5",
    email: "mike@example.com",
    phone: null,
    username: "mike",
    fullName: "Mike Stone",
    avatarUrl: null,
    about: "Voice notes fan",
    isPrivate: true,
    lastSeenAt: "2026-03-24T20:10:00.000Z",
    presence: "away"
  }
];

export const chats: ChatSummary[] = [
  {
    id: "f1799e8f-684f-4a80-9516-3fd3835d4880",
    title: "Alexa Reed",
    isGroup: false,
    isArchived: false,
    avatarUrl: null,
    unreadCount: 2,
    updatedAt: "2026-03-24T20:45:00.000Z",
    lastMessage: {
      id: "0e7f68b9-aa93-4f41-abc7-3f0ff2d31de8",
      content: "I pushed the motion animation updates",
      senderId: "cb628d22-8a2a-4890-8834-7b4b3f18b314",
      createdAt: "2026-03-24T20:45:00.000Z",
      kind: "text",
      status: "delivered"
    },
    participants: [
      { id: currentUserId, username: "you", avatarUrl: null, presence: "online" },
      { id: "cb628d22-8a2a-4890-8834-7b4b3f18b314", username: "alexa", avatarUrl: null, presence: "online" }
    ]
  },
  {
    id: "6f1f19af-832f-47f8-aa8c-305cc8f202a7",
    title: "Mike Stone",
    isGroup: false,
    isArchived: true,
    avatarUrl: null,
    unreadCount: 0,
    updatedAt: "2026-03-24T19:12:00.000Z",
    lastMessage: {
      id: "6b45ae7c-6fc7-4f64-90fe-89629495bf6a",
      content: "Voice message",
      senderId: currentUserId,
      createdAt: "2026-03-24T19:12:00.000Z",
      kind: "voice",
      status: "read"
    },
    participants: [
      { id: currentUserId, username: "you", avatarUrl: null, presence: "online" },
      { id: "be4f3641-c6ac-4256-a622-f37514c8a0a5", username: "mike", avatarUrl: null, presence: "away" }
    ]
  }
];

export const messagesByChatId: Record<string, Message[]> = {
  "f1799e8f-684f-4a80-9516-3fd3835d4880": [
    {
      id: "c0823448-90e2-45e0-9988-d58001f9b1c3",
      chatId: "f1799e8f-684f-4a80-9516-3fd3835d4880",
      senderId: "cb628d22-8a2a-4890-8834-7b4b3f18b314",
      content: "Do we keep dark mode as default?",
      kind: "text",
      voiceUrl: null,
      durationSec: null,
      createdAt: "2026-03-24T20:42:00.000Z",
      editedAt: null,
      status: "read"
    },
    {
      id: "0e7f68b9-aa93-4f41-abc7-3f0ff2d31de8",
      chatId: "f1799e8f-684f-4a80-9516-3fd3835d4880",
      senderId: "cb628d22-8a2a-4890-8834-7b4b3f18b314",
      content: "I pushed the motion animation updates",
      kind: "text",
      voiceUrl: null,
      durationSec: null,
      createdAt: "2026-03-24T20:45:00.000Z",
      editedAt: null,
      status: "delivered"
    }
  ],
  "6f1f19af-832f-47f8-aa8c-305cc8f202a7": [
    {
      id: "6b45ae7c-6fc7-4f64-90fe-89629495bf6a",
      chatId: "6f1f19af-832f-47f8-aa8c-305cc8f202a7",
      senderId: currentUserId,
      content: "Voice message",
      kind: "voice",
      voiceUrl: "https://example.com/voice-note.webm",
      durationSec: 14,
      createdAt: "2026-03-24T19:12:00.000Z",
      editedAt: null,
      status: "read"
    }
  ]
};
