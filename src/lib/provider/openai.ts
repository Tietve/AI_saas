import { LLMProvider, ChatCompletionInput, ChatCompletionOutput, ChatStreamChunk } from "./base";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements LLMProvider {
    name = "openai";

    async chat(input: ChatCompletionInput): Promise<ChatCompletionOutput> {
        const t0 = Date.now();

        const res = await fetch(OPENAI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: input.model,
                messages: input.messages,
                temperature: input.temperature ?? 0.3,
                max_tokens: 512,
            }),
        });

        if (!res.ok) {
            const msg = await res.text();
            throw new Error(`OPENAI_ERROR ${res.status}: ${msg}`);
        }

        const json = await res.json();
        if (process.env.DEBUG_OPENAI === "1") {
            console.log("[OPENAI_RAW]", JSON.stringify(json));
        }

        let content = "";
        const choice = json?.choices?.[0] ?? {};
        const msg = choice?.message ?? {};

        if (typeof msg.content === "string" && msg.content.trim()) {
            content = msg.content;
        } else if (Array.isArray(msg.content)) {
            content = msg.content.map((p: any) => (typeof p === "string" ? p : p?.text ?? "")).join("").trim();
        }
        if (!content && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
            content = "[Model returned tool_calls – no text content]";
        }
        if (!content && msg.refusal) {
            content = msg.refusal;
        }
        if (!content) {
            content = "[Empty response from provider]";
        }

        const usage = json?.usage ?? {};
        return {
            content,
            model: json?.model,
            promptTokens: usage?.prompt_tokens,
            completionTokens: usage?.completion_tokens,
            latencyMs: Date.now() - t0,
        };
    }

    async *stream(input: ChatCompletionInput): Promise<AsyncGenerator<ChatStreamChunk>> {
        const res = await fetch(OPENAI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: input.model,
                messages: input.messages,
                temperature: input.temperature ?? 0.3,
                stream: true,
                max_tokens: 512,
            }),
        });

        if (!res.ok || !res.body) {
            const msg = await res.text().catch(() => "");
            throw new Error(`OPENAI_STREAM_ERROR ${res.status}: ${msg}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data:")) continue;

                const data = trimmed.slice(5).trim();
                if (data === "[DONE]") {
                    yield { done: true };
                    return;
                }

                try {
                    const obj = JSON.parse(data);
                    const delta = obj?.choices?.[0]?.delta?.content;
                    if (delta) yield { contentDelta: delta };
                } catch {}
            }
        }

        yield { done: true };
    }
}

export const openaiProvider = new OpenAIProvider();
