import { AIProvider, GenerateOptions, AIResponse } from './types';
import { OpenAIProvider } from './openai-provider';
import { ClaudeProvider } from './claude-provider';
import { QueryComplexityAnalyzer } from './query-analyzer';
import { withCircuitBreaker } from '@/lib/error/error-handler';

interface ProviderConfig {
    openai?: string;
    claude?: string;
    gemini?: string;
}

export class MultiProviderGateway {
    private providers: Map<string, AIProvider> = new Map();
    private analyzer: QueryComplexityAnalyzer;
    private providerPriority = ['openai', 'claude', 'gemini'];
    private lastUsedProvider: string | null = null;

    constructor(config: ProviderConfig) {
        this.analyzer = new QueryComplexityAnalyzer();

        if (config.openai) {
            this.providers.set('openai', new OpenAIProvider(config.openai));
        }
        if (config.claude) {
            this.providers.set('claude', new ClaudeProvider(config.claude));
        }
        
    }

    async routeRequest(
        query: string,
        options?: GenerateOptions & { forceProvider?: string }
    ): Promise<AIResponse> {
        
        const complexity = this.analyzer.analyzeComplexity(query);
        console.log(`Query complexity: ${(complexity * 100).toFixed(1)}%`);

        
        const provider = await this.selectProvider(complexity, options?.forceProvider);

        
        let model: string | undefined;
        if (provider instanceof OpenAIProvider || provider instanceof ClaudeProvider) {
            model = provider.getModelForComplexity(complexity);
        }

        
        try {
            const response = await withCircuitBreaker(
                provider.name,
                () => provider.generate(query, {
                    ...options,
                    model: options?.model || model
                }),
                {
                    failureThreshold: 3,
                    recoveryTimeout: 30000, // 30 seconds
                }
            );

            this.lastUsedProvider = provider.name;

            console.log(`Used ${provider.name}/${response.model} - Cost: $${response.usage.totalCost.toFixed(6)}`);

            return response;
        } catch (error) {
            console.error(`Provider ${provider.name} failed, trying fallback...`);
            return this.fallbackRequest(query, provider.name, options);
        }
    }

    async routeStreamRequest(
        query: string,
        options?: GenerateOptions & { forceProvider?: string }
    ): Promise<AsyncGenerator<string>> {
        const complexity = this.analyzer.analyzeComplexity(query);
        const provider = await this.selectProvider(complexity, options?.forceProvider);

        let model: string | undefined;
        if (provider instanceof OpenAIProvider || provider instanceof ClaudeProvider) {
            model = provider.getModelForComplexity(complexity);
        }

        try {
            return provider.generateStream(query, {
                ...options,
                model: options?.model || model
            });
        } catch (error) {
            console.error(`Stream provider ${provider.name} failed`);
            throw error;
        }
    }

    private async selectProvider(
        complexity: number,
        forceProvider?: string
    ): Promise<AIProvider> {
        if (forceProvider && this.providers.has(forceProvider)) {
            const provider = this.providers.get(forceProvider)!;
            if (await provider.isAvailable()) {
                return provider;
            }
        }

        
        const preferredOrder = complexity < 0.5
            ? ['openai', 'claude', 'gemini']  
            : ['claude', 'openai', 'gemini'];  

        for (const name of preferredOrder) {
            const provider = this.providers.get(name);
            if (provider && await provider.isAvailable()) {
                return provider;
            }
        }

        throw new Error('No available providers');
    }

    private async fallbackRequest(
        query: string,
        failedProvider: string,
        options?: GenerateOptions
    ): Promise<AIResponse> {
        const availableProviders = Array.from(this.providers.entries())
            .filter(([name]) => name !== failedProvider);

        for (const [name, provider] of availableProviders) {
            try {
                if (await provider.isAvailable()) {
                    return await provider.generate(query, options);
                }
            } catch (error) {
                console.error(`Fallback provider ${name} also failed`);
                continue;
            }
        }

        throw new Error('All providers failed');
    }

    async checkProvidersHealth(): Promise<Record<string, boolean>> {
        const health: Record<string, boolean> = {};

        for (const [name, provider] of this.providers) {
            health[name] = await provider.isAvailable();
        }

        return health;
    }

    estimateCost(query: string): Record<string, number> {
        const tokens = this.analyzer.estimateTokens(query);
        const costs: Record<string, number> = {};

        for (const [name, provider] of this.providers) {
            costs[name] = provider.estimateCost(tokens);
        }

        return costs;
    }
}
