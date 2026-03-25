import { ChatSummary, Message, UserProfile } from "@/types/chat";

export const currentUserId = "";

export const users: UserProfile[] = [];

export const chats: ChatSummary[] = [];

export const messagesByChatId: Record<string, Message[]> = {};
