// lib/ai-providers/base-provider.ts
export interface AIProvider {
    name: string;
    generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
    generateStream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
    estimateCost(tokens: number): number;
    isAvailable(): Promise<boolean>;
}

export interface GenerateOptions {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    model?: string;
}

export interface AIResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalCost: number;
    };
    provider: string;
    model: string;
    latency: number;
}