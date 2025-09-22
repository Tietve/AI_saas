

export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export type ChatResult = {
    content: string;
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    latencyMs?: number;
};

export type StreamChunk = { contentDelta?: string; done?: boolean };
export type StreamGenerator = AsyncGenerator<StreamChunk, void, unknown>;

export interface Provider {
    name: string;
    chat(args: {
        model: string;
        messages: ChatMessage[];
        temperature?: number;
    }): Promise<ChatResult>;
    stream(args: {
        model: string;
        messages: ChatMessage[];
        temperature?: number;
    }): StreamGenerator;
}

const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 45000);

function assertEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env ${name}`);
    return v;
}

function abortIn(ms: number): { signal: AbortSignal; cleanup: () => void } {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    return { signal: controller.signal, cleanup: () => clearTimeout(t) };
}


export const mockProvider: Provider = {
    name: "mock",
    async chat({ messages }: { messages: ChatMessage[] }): Promise<ChatResult> {
        const last = messages[messages.length - 1]?.content ?? "";
        const content = `ĐÃ NHẬN: "${last}" (mock, không gọi AI)`;
        return { content, model: "mock", latencyMs: 5 };
    },
    async *stream({ messages }: { messages: ChatMessage[] }): StreamGenerator {
        const last = messages[messages.length - 1]?.content ?? "";
        const chunks = ["ĐÃ", " NHẬN: \"", last, "\" (mock)"];
        for (const c of chunks) {
            yield { contentDelta: c };
            await new Promise<void>((r) => setTimeout(r, 60));
        }
        yield { done: true };
    },
};

/** -------- OpenAI via Fetch (không cần SDK) -------- */
export const openaiFetchProvider: Provider = {
    name: "openai",
    async chat({ model, messages, temperature }: { model: string; messages: ChatMessage[]; temperature?: number; }): Promise<ChatResult> {
        const key = assertEnv("OPENAI_API_KEY");
        const { signal, cleanup } = abortIn(timeoutMs);
        const started = Date.now();
        try {
            const resp = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${key}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ model, temperature: temperature ?? 0.3, messages }),
                signal,
            });
            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                throw new Error(`OpenAI error ${resp.status}: ${text}`);
            }
            const json: any = await resp.json();
            const choice = json?.choices?.[0];
            const content: string = choice?.message?.content ?? "";
            const usage = json?.usage;
            return {
                content,
                model: json?.model ?? model,
                promptTokens: usage?.prompt_tokens ?? undefined,
                completionTokens: usage?.completion_tokens ?? undefined,
                latencyMs: Date.now() - started,
            };
        } finally {
            cleanup();
        }
    },

    async *stream({ model, messages, temperature }: { model: string; messages: ChatMessage[]; temperature?: number; }): StreamGenerator {
        const key = assertEnv("OPENAI_API_KEY");
        const { signal, cleanup } = abortIn(timeoutMs);
        try {
            const resp = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${key}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ model, temperature: temperature ?? 0.3, messages, stream: true }),
                signal,
            });
            if (!resp.ok || !resp.body) {
                const text = await resp.text().catch(() => "");
                throw new Error(`OpenAI stream error ${resp.status}: ${text}`);
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // SSE blocks are separated by double newlines
                const parts = buffer.split("\n\n");
                buffer = parts.pop() ?? "";

                for (const part of parts) {
                    const line = part.trim();
                    if (!line.startsWith("data:")) continue;
                    const data = line.replace(/^data:\s*/, "");
                    if (data === "[DONE]") {
                        yield { done: true };
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const delta: unknown = json?.choices?.[0]?.delta?.content;
                        if (typeof delta === "string" && delta) {
                            yield { contentDelta: delta };
                        }
                    } catch {
                        
                    }
                }
            }

            yield { done: true };
        } finally {
            cleanup();
        }
    },
};


export function getProvider(): Provider {
    if (process.env.MOCK_AI === "1") return mockProvider;
    return openaiFetchProvider;
}
