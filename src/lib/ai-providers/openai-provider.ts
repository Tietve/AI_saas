import OpenAI from 'openai';
import { AIProvider, GenerateOptions, AIResponse } from './types';

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    name = 'openai';

    private models = {
        weak: 'gpt-3.5-turbo',
        medium: 'gpt-4o-mini',
        strong: 'gpt-4o'
    };

    private costs = {
        'gpt-3.5-turbo': { input: 0.5, output: 1.5 }, // per 1M tokens
        'gpt-4o-mini': { input: 0.15, output: 0.6 },
        'gpt-4o': { input: 2.5, output: 10 }
    };

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
        const startTime = Date.now();
        const model = options?.model || this.models.medium;

        try {
            const response = await this.client.chat.completions.create({
                model,
                messages: [
                    ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
                    { role: 'user' as const, content: prompt }
                ],
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens
            });

            const usage = response.usage!;
            const cost = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

            return {
                content: response.choices[0].message.content!,
                usage: {
                    promptTokens: usage.prompt_tokens,
                    completionTokens: usage.completion_tokens,
                    totalCost: cost
                },
                provider: this.name,
                model,
                latency: Date.now() - startTime
            };
        } catch (error) {
            console.error(`OpenAI error:`, error);
            throw error;
        }
    }

    async *generateStream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
        const model = options?.model || this.models.medium;

        const stream = await this.client.chat.completions.create({
            model,
            messages: [
                ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
                { role: 'user' as const, content: prompt }
            ],
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens,
            stream: true
        });

        for await (const chunk of stream) {
            yield chunk.choices[0]?.delta?.content || '';
        }
    }

    calculateCost(model: string, inputTokens: number, outputTokens: number): number {
        const pricing = this.costs[model as keyof typeof this.costs];
        return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
    }

    estimateCost(tokens: number): number {
        const mediumModel = this.models.medium as keyof typeof this.costs;
        return tokens * this.costs[mediumModel].input / 1_000_000;
    }

    async isAvailable(): Promise<boolean> {
        try {
            await this.client.models.list();
            return true;
        } catch {
            return false;
        }
    }

    getModelForComplexity(complexity: number): string {
        if (complexity < 0.3) return this.models.weak;
        if (complexity < 0.7) return this.models.medium;
        return this.models.strong;
    }
}