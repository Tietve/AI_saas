// src/components/chat/shared/types.ts

// Import BotPersonality từ personality-templates thay vì định nghĩa lại
export type { BotPersonality } from '@/lib/bots/personality-templates'

export interface Message {
    id: string
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
    content: string
    createdAt: string
    isStreaming?: boolean
    error?: boolean
    model?: string
    botId?: string
}

export interface Conversation {
    id: string
    title: string
    updatedAt: string
    messageCount?: number
    model?: string
    botId?: string
}

// Export ModelOption type
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