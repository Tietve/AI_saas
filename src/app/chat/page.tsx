"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatComposer from "./components/ChatComposer";
import { postJSON, getJSON } from "@/lib/api";
import type { Conversation, Message } from "@/types/chat";
import { useSSEStream } from "@/hooks/useSSEStream";
import { MessageSquare, Plus, RotateCcw, Trash2 } from "lucide-react";
import Markdown from "@/components/Markdown";
import { Clipboard, Check } from "lucide-react";

type ConvListResponse = { items: Conversation[] };
type MsgListResponse = { messages: Message[] };

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [booting, setBooting] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { start: startStream, stop: stopStream, streaming } = useSSEStream();

    // Khung danh sách để auto-scroll, bố cục không làm cuộn trang
    const listRef = useRef<HTMLDivElement>(null);

    // Load danh sách hội thoại
    useEffect(() => {
        (async () => {
            try {
                const data = await getJSON<ConvListResponse>("/api/conversations");
                setConversations(data.items || []);
                if (data.items?.length) setActiveId(data.items[0].id);
            } catch (e: any) {
                setError(e?.message || "Load conversations failed");
            } finally {
                setBooting(false);
            }
        })();
    }, []);

    // Load lịch sử khi đổi active
    useEffect(() => {
        if (!activeId) { setMessages([]); return; }
        (async () => {
            try {
                setError(null);
                const data = await getJSON<MsgListResponse>(`/api/conversations/${activeId}/messages`);
                setMessages(data.messages || []);
            } catch (e: any) {
                setError(e?.message || "Load messages failed");
            }
        })();
    }, [activeId]);

    // Auto-scroll KHÔN: chỉ scroll nếu đang ở gần cuối (để Composer luôn trong tầm mắt)
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const threshold = 120; // px từ đáy
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        if (atBottom) {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
    }, [messages]);

    // New chat
    async function newChat() {
        setError(null);
        try {
            const created = await postJSON<{ id: string }>("/api/conversations", { title: "New chat" });
            const now = new Date().toISOString();
            setConversations(prev => [{ id: created.id, title: "New chat", createdAt: now, updatedAt: now }, ...prev]);
            setActiveId(created.id);
            setMessages([]);
        } catch (e: any) {
            setError(e?.message || "Create conversation failed");
        }
    }

    // Stream send
    async function sendMessageStream(text: string) {
        setError(null);
        const now = new Date().toISOString();
        const userMsgId = `u_${Date.now()}`;
        const assistantDraftId = `a_${Date.now()}`;

        setMessages(prev => [
            ...prev,
            { id: userMsgId, conversationId: activeId || "pending", role: "USER", content: text, createdAt: now },
            { id: assistantDraftId, conversationId: activeId || "pending", role: "ASSISTANT", content: "", createdAt: now },
        ]);

        await startStream(
            "/api/chat/stream",
            { conversationId: activeId || undefined, message: text, temperature: 0.3, force: true },
            {
                onMeta: (meta) => {
                    if (!activeId && meta?.conversationId) {
                        setActiveId(meta.conversationId);
                        setConversations(prev => [
                            { id: meta.conversationId, title: text.slice(0, 40), createdAt: now, updatedAt: now },
                            ...prev,
                        ]);
                    }
                },
                onDelta: (delta) => {
                    setMessages(prev =>
                        prev.map(m => m.id === assistantDraftId ? { ...m, content: (m.content || "") + delta } : m)
                    );
                },
                onError: (err) => setError(err || "Stream error"),
            }
        );
    }

    async function renameConversation(id: string, current: string) {
        const newTitle = prompt("Đặt tên mới:", current || "");
        if (!newTitle?.trim()) return;
        try {
            const res = await postJSON<{ conversation: Conversation }>(`/api/conversations/${id}/rename`, { title: newTitle });
            setConversations(prev => prev.map(c => c.id === id ? res.conversation : c));
        } catch (e: any) {
            setError(e?.message || "Rename failed");
        }
    }

    async function deleteConversation(id: string) {
        if (!confirm("Bạn có chắc muốn xoá hội thoại này?")) return;
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text().catch(() => "Delete failed"));
            setConversations(prev => prev.filter(c => c.id !== id));
            if (activeId === id) { setActiveId(null); setMessages([]); }
            // refetch lại list cho chắc
            try {
                const fresh = await getJSON<{ items: Conversation[] }>("/api/conversations");
                setConversations(fresh.items || []);
            } catch {}
        } catch (e: any) {
            setError(e?.message || "Delete failed");
        }
    }

    const activeLabel = useMemo(() => {
        const found = conversations.find(c => c.id === activeId);
        return found?.title || (activeId ? "Untitled" : "No conversation");
    }, [conversations, activeId]);

    return (
        <div className="h-dvh overflow-hidden grid grid-cols-[260px_1fr] bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
            {/* Sidebar */}
            <aside className="border-r border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0">
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold"><MessageSquare className="h-5 w-5" />Conversations</div>
                    <button
                        onClick={newChat}
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        title="New"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    {conversations.map(c => (
                        <div key={c.id} className="flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900">
                            <button
                                onClick={() => setActiveId(c.id)}
                                onDoubleClick={() => renameConversation(c.id, c.title)}
                                className={`flex-1 text-left px-3 py-2 truncate ${c.id === activeId ? "bg-zinc-100 dark:bg-zinc-900 font-medium" : ""}`}
                                title={c.id}
                            >
                                {c.title || "(untitled)"}
                            </button>
                            {/* luôn hiện thùng rác */}
                            <button
                                onClick={() => deleteConversation(c.id)}
                                className="px-2 text-red-500"
                                title="Xoá hội thoại"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {!conversations.length && !booting && (
                        <div className="p-3 text-sm opacity-70">Chưa có hội thoại nào.</div>
                    )}
                </div>

                <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 text-xs opacity-60">v0.5 • Stable layout</div>
            </aside>

            {/* Main (không cuộn trang, chỉ cuộn danh sách) */}
            <main className="flex flex-col min-h-0">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                    <div className="font-semibold truncate">{activeLabel}</div>
                    <div className="ml-auto flex items-center gap-2 opacity-70">
                        <button
                            onClick={stopStream}
                            disabled={!streaming}
                            className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
                            title="Stop streaming"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Chỉ phần này cuộn */}
                <div
                    ref={listRef}
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
                >
                    {messages.length === 0 ? (
                        <div className="opacity-60 text-sm">Chưa có tin nhắn nào, hãy gửi câu đầu tiên.</div>
                    ) : (
                        messages.map(m => <MessageListItem key={m.id} m={m} />)
                    )}
                </div>

                {/* Composer cố định đáy, không trôi */}
                <ChatComposer onSend={sendMessageStream} disabled={loading || streaming} />

                {error && (
                    <div className="px-4 py-2 text-sm text-red-600 border-t border-red-200 bg-red-50 dark:bg-red-950/30 dark:text-red-300">
                        {error}
                    </div>
                )}
            </main>
        </div>
    );
}

function MessageListItem({ m }: { m: Message }) {
    const mine = m.role === "USER";
    return (
        <div className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
            <div
                className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold shadow-sm select-none ${
                    mine ? "bg-blue-600 text-white" : "bg-gradient-to-br from-fuchsia-600 to-blue-600 text-white"
                }`}
            >
                {mine ? "U" : "AI"}
            </div>

            {/* bubble */}
            <div
                className={`relative max-w-[80ch] rounded-2xl px-4 py-3 shadow-sm leading-relaxed ${
                    mine ? "bg-blue-600 text-white whitespace-pre-wrap" : "bg-zinc-50 dark:bg-zinc-900"
                }`}
            >
                {/* Nút Copy cho TOÀN BỘ tin nhắn – chỉ hiện với assistant */}
                {!mine && <CopyMessageBtn text={m.content} />}

                {/* Nội dung */}
                {mine ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                ) : (
                    <Markdown>{m.content}</Markdown>
                )}
            </div>
        </div>
    );
}

function CopyMessageBtn({ text }: { text: string }) {
    const [ok, setOk] = useState(false);

    async function doCopy() {
        try {
            await navigator.clipboard.writeText(text);
            setOk(true);
            setTimeout(() => setOk(false), 1200);
        } catch {}
    }

    return (
        <button
            onClick={doCopy}
            title="Copy message"
            className="absolute -top-2 right-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90
                 px-2 py-1 text-xs shadow-sm hover:bg-white dark:hover:bg-zinc-900 transition flex items-center gap-1"
        >
            {ok ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
            {ok ? "Copied" : "Copy"}
        </button>
    );
}// Nút copy cho toàn bộ nội dung 1 message
