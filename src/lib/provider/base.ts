// 📁 File: src/lib/provider/base.ts (provider abstraction – giao diện chuẩn LLM)
// ============================================================================
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
    contentDelta?: string; // phần nội dung mới xuất hiện
    done?: boolean; // đánh dấu kết thúc stream
}


export interface LLMProvider {
    name: string;
    chat(input: ChatCompletionInput): Promise<ChatCompletionOutput>;
    stream(input: ChatCompletionInput): Promise<AsyncGenerator<ChatStreamChunk>>;
}