

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };


export interface ChatCompletionInput {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
}


export interface ChatCompletionOutput {
    content: string;
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    latencyMs?: number;
}


export interface ChatStreamChunk {
    contentDelta?: string; 
    done?: boolean; 
}


export interface LLMProvider {
    name: string;
    chat(input: ChatCompletionInput): Promise<ChatCompletionOutput>;
    stream(input: ChatCompletionInput): Promise<AsyncGenerator<ChatStreamChunk>>;
}