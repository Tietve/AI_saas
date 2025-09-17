import { AIProvider, GenerateOptions, AIResponse } from './types';
import { OpenAIProvider } from './openai-provider';
import { ClaudeProvider } from './claude-provider';
import { QueryComplexityAnalyzer } from './query-analyzer';

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
        // Add Gemini provider when ready
    }

    async routeRequest(
        query: string,
        options?: GenerateOptions & { forceProvider?: string }
    ): Promise<AIResponse> {
        // Analyze query complexity
        const complexity = this.analyzer.analyzeComplexity(query);
        console.log(`Query complexity: ${(complexity * 100).toFixed(1)}%`);

        // Select provider
        const provider = await this.selectProvider(complexity, options?.forceProvider);

        // Select appropriate model based on complexity
        let model: string | undefined;
        if (provider instanceof OpenAIProvider || provider instanceof ClaudeProvider) {
            model = provider.getModelForComplexity(complexity);
        }

        // Make request with fallback
        try {
            const response = await provider.generate(query, {
                ...options,
                model: options?.model || model
            });

            this.lastUsedProvider = provider.name;

            // Log for analytics
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

        // Cost-optimized selection based on complexity
        const preferredOrder = complexity < 0.5
            ? ['openai', 'claude', 'gemini']  // OpenAI cheaper for simple
            : ['claude', 'openai', 'gemini'];  // Claude better for complex

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
