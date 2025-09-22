
import { AIProvider, ChatParams, ChatResponse } from './types'

export class ProviderManager {
    private providers: Map<string, AIProvider> = new Map()

    constructor() {
        
        this.initializeProviders()
    }

    private async initializeProviders() {
        
        if (process.env.OPENAI_API_KEY) {
            
            const openaiProvider: AIProvider = {
                id: 'openai',
                name: 'OpenAI',
                models: [],
                supportsStreaming: true,
                supportsImages: true,
                supportsAudio: true,
                supportsTools: true,
                chat: async (params) => {
                    
                    return {
                        content: 'OpenAI response placeholder',
                        model: params.model,
                        usage: { promptTokens: 0, completionTokens: 0 },
                        latency: 0
                    }
                },
                stream: async function* (params) {
                    
                    yield { delta: 'Streaming placeholder' }
                    yield { done: true }
                }
            }
            this.providers.set('openai', openaiProvider)
        }

        
    }

    registerProvider(provider: AIProvider) {
        this.providers.set(provider.id, provider)
    }

    getProvider(providerId: string): AIProvider | undefined {
        return this.providers.get(providerId)
    }

    getAllProviders(): AIProvider[] {
        return Array.from(this.providers.values())
    }

    getAvailableModels() {
        const models = []
        for (const provider of this.providers.values()) {
            models.push(...provider.models)
        }
        return models
    }

    async chat(params: ChatParams & { providerId: string }): Promise<ChatResponse> {
        const provider = this.getProvider(params.providerId)
        if (!provider) {
            throw new Error(`Provider ${params.providerId} not found`)
        }
        return provider.chat(params)
    }

    async *stream(params: ChatParams & { providerId: string }) {
        const provider = this.getProvider(params.providerId)
        if (!provider || !provider.stream) {
            throw new Error(`Provider ${params.providerId} does not support streaming`)
        }
        yield* provider.stream(params)
    }
}


export const providerManager = new ProviderManager()