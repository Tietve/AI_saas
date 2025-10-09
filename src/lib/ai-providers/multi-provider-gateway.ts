import { AIProvider, GenerateOptions, AIResponse } from './types';
import { OpenAIProvider } from './openai-provider';
import { ClaudeProvider } from './claude-provider';
import { QueryComplexityAnalyzer } from './query-analyzer';
import { withCircuitBreaker } from '@/lib/error/error-handler';
import { getSemanticCache, SemanticCache } from '@/lib/cache/semantic-cache';
import { logger, logAiRequest } from '@/lib/logger';
import { MetricsService } from '@/services/metrics.service';
import { AIProvider as AIProviderEnum, ModelId } from '@prisma/client';

interface ProviderConfig {
    openai?: string;
    claude?: string;
    gemini?: string;
    enableSemanticCache?: boolean;
    metricsService?: MetricsService;
}

export class MultiProviderGateway {
    private providers: Map<string, AIProvider> = new Map();
    private analyzer: QueryComplexityAnalyzer;
    private providerPriority = ['openai', 'claude', 'gemini'];
    private lastUsedProvider: string | null = null;
    private semanticCache: SemanticCache | null = null;
    private enableSemanticCache: boolean;
    private metricsService: MetricsService | null = null;

    constructor(config: ProviderConfig) {
        this.analyzer = new QueryComplexityAnalyzer();
        this.enableSemanticCache = config.enableSemanticCache ?? true;
        this.metricsService = config.metricsService ?? null;

        if (config.openai) {
            this.providers.set('openai', new OpenAIProvider(config.openai));
        }
        if (config.claude) {
            this.providers.set('claude', new ClaudeProvider(config.claude));
        }

        // Initialize semantic cache
        if (this.enableSemanticCache) {
            this.semanticCache = getSemanticCache();
            if (this.semanticCache) {
                logger.info('Semantic cache enabled in MultiProviderGateway');
            }
        }
    }

    async routeRequest(
        query: string,
        options?: GenerateOptions & { forceProvider?: string; skipCache?: boolean }
    ): Promise<AIResponse> {
        const startTime = Date.now();

        const complexity = this.analyzer.analyzeComplexity(query);
        logger.debug({ complexity: (complexity * 100).toFixed(1) }, 'Query complexity analyzed');

        const provider = await this.selectProvider(complexity, options?.forceProvider);

        let model: string | undefined;
        if (provider instanceof OpenAIProvider || provider instanceof ClaudeProvider) {
            model = provider.getModelForComplexity(complexity);
        }

        const finalModel = options?.model || model || 'unknown';

        // Check semantic cache first (unless explicitly skipped)
        if (this.semanticCache && !options?.skipCache) {
            const cached = await this.semanticCache.findSimilar(query, finalModel);

            if (cached) {
                const latency = Date.now() - startTime;

                logger.info(
                    {
                        model: finalModel,
                        cached: true,
                        latency,
                        savings: cached.costUsd.toFixed(6),
                    },
                    'Semantic cache HIT - returning cached response'
                );

                // Return cached response in AIResponse format
                return {
                    content: cached.response,
                    model: cached.model,
                    provider: 'cache', // Cached responses don't have specific provider
                    usage: {
                        promptTokens: cached.tokensIn,
                        completionTokens: cached.tokensOut,
                        totalCost: 0, // No cost for cached responses
                    },
                    latency,
                };
            }
        }

        try {
            const wrappedFn = withCircuitBreaker(
                provider.name,
                async () => {
                    return await provider.generate(query, {
                        ...options,
                        model: finalModel
                    })
                },
                {
                    failureThreshold: 3,
                    recoveryTimeout: 30000, // 30 seconds
                }
            );

            const response = await wrappedFn();

            this.lastUsedProvider = provider.name;

            const latency = Date.now() - startTime;

            // Log AI request
            logAiRequest({
                provider: provider.name,
                model: response.model || finalModel,
                tokensIn: response.usage?.promptTokens || 0,
                tokensOut: response.usage?.completionTokens || 0,
                costUsd: response.usage?.totalCost || 0,
                latency,
                cached: false,
            });

            // Track metrics
            if (this.metricsService) {
                const providerEnum = this.mapProviderName(provider.name);
                const modelEnum = this.mapModelId(response.model || finalModel);

                if (providerEnum && modelEnum) {
                    await this.metricsService.recordMetric({
                        provider: providerEnum,
                        model: modelEnum,
                        latencyMs: latency,
                        costUsd: response.usage?.totalCost || 0,
                        success: true,
                        tokensIn: response.usage?.promptTokens || 0,
                        tokensOut: response.usage?.completionTokens || 0,
                        userId: options?.userId,
                        requestId: options?.requestId,
                    });
                }
            }

            // Store in semantic cache
            if (this.semanticCache && !options?.skipCache && response.content) {
                await this.semanticCache.set({
                    query,
                    response: response.content,
                    model: finalModel,
                    tokensIn: response.usage?.promptTokens || 0,
                    tokensOut: response.usage?.completionTokens || 0,
                    costUsd: response.usage?.totalCost || 0,
                    metadata: {
                        provider: provider.name,
                        complexity,
                    },
                });
            }

            return response;
        } catch (error) {
            const latency = Date.now() - startTime;

            // Track failed metrics
            if (this.metricsService) {
                const providerEnum = this.mapProviderName(provider.name);
                const modelEnum = this.mapModelId(finalModel);

                if (providerEnum && modelEnum) {
                    await this.metricsService.recordMetric({
                        provider: providerEnum,
                        model: modelEnum,
                        latencyMs: latency,
                        costUsd: 0,
                        success: false,
                        errorCode: (error as any)?.code || 'UNKNOWN',
                        errorMessage: (error as Error)?.message || 'Unknown error',
                        userId: options?.userId,
                        requestId: options?.requestId,
                    });
                }
            }

            logger.error(
                { err: error, provider: provider.name },
                `Provider ${provider.name} failed, trying fallback`
            );
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
                logger.error({ err: error, provider: name }, `Fallback provider ${name} also failed`);
                continue;
            }
        }

        throw new Error('All providers failed');
    }

    /**
     * Get semantic cache statistics
     */
    async getCacheStats(model?: string): Promise<any> {
        if (!this.semanticCache) {
            return { enabled: false };
        }

        const stats = await this.semanticCache.getStats(model);
        return {
            enabled: true,
            ...stats,
        };
    }

    /**
     * Clear semantic cache for a model
     */
    async clearCache(model: string): Promise<number> {
        if (!this.semanticCache) {
            return 0;
        }

        return await this.semanticCache.clearModel(model);
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

    /**
     * Map provider name to AIProviderEnum
     */
    private mapProviderName(providerName: string): AIProviderEnum | null {
        const mapping: Record<string, AIProviderEnum> = {
            'openai': AIProviderEnum.OPENAI,
            'claude': AIProviderEnum.ANTHROPIC,
            'gemini': AIProviderEnum.GOOGLE,
        };
        return mapping[providerName.toLowerCase()] || null;
    }

    /**
     * Map model string to ModelId enum (best effort)
     */
    private mapModelId(modelStr: string): ModelId | null {
        // Normalize model string
        const normalized = modelStr.toLowerCase().replace(/[-.]/g, '_');

        // Try to find matching ModelId
        const modelMap: Record<string, ModelId> = {
            'gpt_4_turbo': ModelId.gpt_4_turbo,
            'gpt_4o': ModelId.gpt_4o,
            'gpt_4o_mini': ModelId.gpt_4o_mini,
            'gpt_3_5_turbo': ModelId.gpt_3_5_turbo,
            'gpt_5': ModelId.gpt_5,
            'gpt_5_mini': ModelId.gpt_5_mini,
            'gpt_5_nano': ModelId.gpt_5_nano,
            'claude_3_opus': ModelId.claude_3_opus,
            'claude_3_5_sonnet': ModelId.claude_3_5_sonnet,
            'claude_3_5_haiku': ModelId.claude_3_5_haiku,
            'gemini_1_5_pro': ModelId.gemini_1_5_pro,
            'gemini_1_5_flash': ModelId.gemini_1_5_flash,
            'gemini_2_0_flash': ModelId.gemini_2_0_flash,
        };

        return modelMap[normalized] || null;
    }
}
