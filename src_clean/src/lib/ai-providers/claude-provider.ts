import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, GenerateOptions, AIResponse } from './types';

export class ClaudeProvider implements AIProvider {
    private client: Anthropic;
    name = 'claude';

    private models = {
        weak: 'claude-3-haiku-20240307',
        medium: 'claude-3-5-sonnet-20241022',
        strong: 'claude-3-5-sonnet-20241022' 
    };

    private costs = {
        'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
        'claude-3-5-sonnet-20241022': { input: 3, output: 15 }
    };

    constructor(apiKey: string) {
        this.client = new Anthropic({ apiKey });
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
        const startTime = Date.now();
        const model = options?.model || this.models.medium;

        try {
            const response = await this.client.messages.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                system: options?.systemPrompt,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens || 4096
            });

            const content = response.content[0].type === 'text'
                ? response.content[0].text
                : '';

            const cost = this.calculateCost(
                model,
                response.usage.input_tokens,
                response.usage.output_tokens
            );

            return {
                content,
                usage: {
                    promptTokens: response.usage.input_tokens,
                    completionTokens: response.usage.output_tokens,
                    totalCost: cost
                },
                provider: this.name,
                model,
                latency: Date.now() - startTime
            };
        } catch (error) {
            console.error(`Claude error:`, error);
            throw error;
        }
    }

    async *generateStream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
        const model = options?.model || this.models.medium;

        const stream = await this.client.messages.create({
            model,
            messages: [{ role: 'user', content: prompt }],
            system: options?.systemPrompt,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens || 4096,
            stream: true
        });

        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                yield chunk.delta.text;
            }
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
            await this.client.messages.create({
                model: this.models.weak,
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 1
            });
            return true;
        } catch {
            return false;
        }
    }

    getModelForComplexity(complexity: number): string {
        if (complexity < 0.3) return this.models.weak;
        return this.models.medium;
    }
}