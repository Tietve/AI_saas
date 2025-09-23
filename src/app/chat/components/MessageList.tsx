"use client";
import type { Message } from "@/types/chat";
import { useEffect, useRef } from "react";
import { AttachmentList } from "@/components/chat/shared/AttachmentList";

export default function MessageList({ items, loading }: { items: Message[]; loading?: boolean }) {
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [items.length]);

    return (
        <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
            {items.map(m => {
                const attachments = m.attachments || []
                const hasText = Boolean(m.content && m.content.trim().length > 0)

                return (
                    <div key={m.id} className={`max-w-[80ch] ${m.role === "USER" ? "ml-auto text-right" : ""}`}>
                        <div className="flex flex-col gap-2">
                            {attachments.length > 0 && (
                                <AttachmentList attachments={attachments} role={m.role} />
                            )}

                            {hasText && (
                                <div className={`inline-block rounded-2xl px-4 py-2 shadow-sm
            ${m.role === "USER" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-zinc-800"}`}>
                                    {m.content}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
            {loading && (
                <div className="opacity-70 text-sm">Đang gửi…</div>
            )}
            <div ref={bottomRef} />
        </div>
    );
}
