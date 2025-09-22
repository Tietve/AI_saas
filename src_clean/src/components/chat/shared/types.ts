


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