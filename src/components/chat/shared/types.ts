


export type { BotPersonality } from '@/lib/bots/personality-templates'

export interface AttachmentMeta {
    name?: string
    size?: number
    mimeType?: string
    width?: number
    height?: number
    [key: string]: unknown
}

export interface Attachment {
    id: string
    kind: 'image' | 'file' | 'pdf' | 'document'
    url: string
    meta?: AttachmentMeta | null
}

export interface Message {
    id: string
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
    content: string
    createdAt: string
    isStreaming?: boolean
    error?: boolean
    model?: string
    botId?: string
    attachments?: Attachment[]
}

export interface Conversation {
    id: string
    title: string
    updatedAt: string
    messageCount?: number
    model?: string
    botId?: string
    pinned?: boolean
    projectId?: string
}


export interface ModelOption {
    id: string
    name: string
    provider: 'openai' | 'anthropic' | 'google'
    speed: 'lightning' | 'fast' | 'balanced' | 'advanced'
    contextWindow: string
    bestFor: string
    capabilities: string[]
    pricing?: {
        input: number
        output: number
    }
}