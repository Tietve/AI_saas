import {
    LLMProvider,
    ChatCompletionInput,
    ChatCompletionOutput,
    ChatStreamChunk,
} from "./base";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements LLMProvider {
    name = "openai";

    async chat(input: ChatCompletionInput): Promise<ChatCompletionOutput> {
        const t0 = Date.now();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

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
                max_tokens: 1024,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
            const msg = await res.text().catch(() => "");
            throw new Error(`OPENAI_ERROR ${res.status}: ${msg}`);
        }

        const json = await res.json();

        if (process.env.DEBUG_OPENAI === "1") {
            console.log("[OPENAI_RAW]", JSON.stringify(json, null, 2));
        }

        const choice = json?.choices?.[0] ?? {};
        const msg = choice?.message ?? {};

        let content = "";

        if (typeof msg.content === "string" && msg.content.trim()) {
            content = msg.content.trim();
        } else if (Array.isArray(msg.content)) {
            content = msg.content
                .map((p: unknown) => (typeof p === "string" ? p : (p as { text?: string })?.text ?? ""))
                .join("")
                .trim();
        } else if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
            content = "[Model returned tool_calls – no text content]";
        } else if (msg.refusal) {
            content = msg.refusal;
        } else {
            content = "[Empty response from provider]";
        }

        const usage = json?.usage ?? {};
        return {
            content,
            model: json?.model,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            latencyMs: Date.now() - t0,
        };
    }

    stream(input: ChatCompletionInput): Promise<AsyncGenerator<ChatStreamChunk>> {
        return new Promise(async (resolve, reject) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000);

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
                    max_tokens: 1024,
                    stream: true,
                }),
                signal: controller.signal,
            }).catch(err => {
                clearTimeout(timeout);
                return reject(new Error(`OPENAI_STREAM_ERROR: ${err.message}`));
            });

            clearTimeout(timeout);

            if (!res || !res.ok || !res.body) {
                const msg = res ? await res.text().catch(() => "") : "No response";
                return reject(new Error(`OPENAI_STREAM_ERROR ${res?.status ?? ""}: ${msg}`));
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            async function* generator(): AsyncGenerator<ChatStreamChunk> {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    for (const line of chunk.split("\n")) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith("data:")) continue;

                        const data = trimmed.slice(5).trim();
                        if (data === "[DONE]") {
                            yield { done: true };
                            return;
                        }

                        try {
                            const obj = JSON.parse(data);
                            const delta = obj?.choices?.[0]?.delta;

                            if (delta?.content) {
                                yield { contentDelta: delta.content };
                            } else if (delta?.tool_calls) {
                                yield { contentDelta: "[tool_calls received]" };
                            }
                        } catch (err) {
                            console.error("OPENAI_STREAM_PARSE_ERROR:", err);
                        }
                    }
                }

                yield { done: true };
            }

            resolve(generator());
        });
    }
}

export const openaiProvider = new OpenAIProvider();
