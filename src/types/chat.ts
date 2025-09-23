import type { Attachment } from '@/components/chat/shared/types';

export type MessageRole = "USER" | "ASSISTANT";

export interface Conversation {
    id: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    createdAt: string;
    attachments?: Attachment[];
}

export interface ChatReply {
    conversationId: string;
    reply: string;
    meta?: any;
}
