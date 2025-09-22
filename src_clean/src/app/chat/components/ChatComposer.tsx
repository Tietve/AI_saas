"use client";
import { useState } from "react";

export default function ChatComposer({
                                         onSend,
                                         disabled,
                                     }: {
    onSend: (text: string) => Promise<void> | void;
    disabled?: boolean;
}) {
    const [text, setText] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const t = text.trim();
        if (!t) return;
        setText("");
        await onSend(t);
    }

    return (
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-zinc-800">
            <div className="flex gap-2">
        <textarea
            className="flex-1 resize-none rounded-xl border px-3 py-2 min-h-[48px] focus:outline-none focus:ring-2
                     border-gray-300 dark:border-zinc-700 focus:ring-blue-500"
            placeholder="Nhập tin nhắn…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
        />
                <button
                    type="submit"
                    disabled={disabled}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
                >
                    Gửi
                </button>
            </div>
        </form>
    );
}
