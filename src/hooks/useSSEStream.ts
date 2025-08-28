"use client";

import { useRef, useState } from "react";

type SSEHandlers = {
    onMeta?: (m: any) => void;
    onDelta?: (text: string) => void;
    onDone?: () => void;
    onError?: (err: string) => void;
};

export function useSSEStream() {
    const controllerRef = useRef<AbortController | null>(null);
    const [streaming, setStreaming] = useState(false);

    async function start(url: string, body: unknown, handlers: SSEHandlers = {}) {
        // nếu đang stream thì dừng trước
        if (streaming) stop();
        setStreaming(true);
        const ctrl = new AbortController();
        controllerRef.current = ctrl;

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: ctrl.signal,
            });

            if (!res.ok || !res.body) {
                const text = await res.text().catch(() => "");
                handlers.onError?.(text || `HTTP ${res.status}`);
                setStreaming(false);
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buf += decoder.decode(value, { stream: true });

                // Cắt từng frame SSE theo "\n\n"
                let idx: number;
                while ((idx = buf.indexOf("\n\n")) !== -1) {
                    const frame = buf.slice(0, idx).trim();
                    buf = buf.slice(idx + 2);
                    if (!frame.startsWith("data:")) continue;

                    const payload = frame.slice(5).trim();
                    if (payload === "[DONE]") {
                        handlers.onDone?.();
                        setStreaming(false);
                        return;
                    }

                    try {
                        const obj = JSON.parse(payload);
                        if (obj.meta) handlers.onMeta?.(obj.meta);
                        if (obj.contentDelta) handlers.onDelta?.(obj.contentDelta);
                        if (obj.done) {
                            handlers.onDone?.();
                            setStreaming(false);
                            return;
                        }
                        if (obj.error) {
                            handlers.onError?.(obj.error);
                            setStreaming(false);
                            return;
                        }
                    } catch {
                        // bỏ qua frame lỗi
                    }
                }
            }

            handlers.onDone?.();
        } catch (e: any) {
            if (e?.name !== "AbortError") {
                handlers.onError?.(e?.message || "STREAM_ABORTED");
            }
        } finally {
            setStreaming(false);
        }
    }

    function stop() {
        controllerRef.current?.abort();
        controllerRef.current = null;
        setStreaming(false);
    }

    return { start, stop, streaming };
}
