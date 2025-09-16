// src/lib/ai/types.ts - Chỉ chứa type definitions
export interface AIProvider {
    id: string
    name: string
    models: AIModel[]
    supportsStreaming: boolean
    supportsImages: boolean
    supportsAudio: boolean
    supportsTools: boolean
    chat(params: ChatParams): Promise<ChatResponse>
    stream?(params: ChatParams): AsyncGenerator<StreamChunk>
}

export interface AIModel {
    id: string
    name: string
    provider: string
    contextLength: number
    costPerMillion: { input: number; output: number }
    capabilities: ModelCapabilities
}

export interface ModelCapabilities {
    text: boolean
    images: boolean
    audio: boolean
    tools: boolean
    search: boolean
}

export interface ChatParams {
    model: string
    messages: Message[]
    temperature?: number
    maxTokens?: number
    tools?: any[] // Simplified for now
    images?: string[]
    audio?: any // Simplified for now
}

export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string | MultiModalContent[]
    toolCalls?: any[] // Simplified for now
}

export interface MultiModalContent {
    type: 'text' | 'image' | 'audio'
    text?: string
    imageUrl?: string
    audioUrl?: string
}

export interface ChatResponse {
    content: string
    model: string
    usage: { promptTokens: number; completionTokens: number }
    latency: number
    toolCalls?: any[] // Simplified for now
}

export interface StreamChunk {
    delta?: string
    toolCall?: any // Simplified for now
    done?: boolean
}

