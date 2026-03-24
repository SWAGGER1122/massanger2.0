export type PresenceStatus = "online" | "away" | "offline";

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  about: string | null;
  isPrivate: boolean;
  lastSeenAt: string | null;
  presence: PresenceStatus;
}

export interface ChatSummary {
  id: string;
  title: string;
  isGroup: boolean;
  isArchived: boolean;
  avatarUrl: string | null;
  unreadCount: number;
  updatedAt: string;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    kind: "text" | "voice";
    status: "sent" | "delivered" | "read";
  } | null;
  participants: Array<Pick<UserProfile, "id" | "username" | "avatarUrl" | "presence">>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  kind: "text" | "voice";
  voiceUrl: string | null;
  durationSec: number | null;
  createdAt: string;
  editedAt: string | null;
  status: "sent" | "delivered" | "read";
}

export interface AppSettings {
  theme: "dark" | "light" | "system";
  showLastSeen: boolean;
  allowCallsFrom: "everyone" | "contacts" | "nobody";
}

export interface UserPrivacySettings {
  showPhoneTo: "everyone" | "contacts" | "nobody";
  showOnlineTo: "everyone" | "contacts" | "nobody";
}

export interface CallSession {
  id: string;
  chatId: string;
  callerId: string;
  channelName: string;
  kind: "audio" | "video";
  status: "ringing" | "active" | "ended" | "missed";
  startedAt: string | null;
  endedAt: string | null;
}
