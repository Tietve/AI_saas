'use client'
import { useEffect, useState } from 'react'

type Item = { id: string; title: string; updatedAt: string; messageCount: number; lastPreview: string }
const STORAGE_KEY = 'chat.conversationId'

export default function SidebarConversations() {
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')

    async function load() {
        setLoading(true)
        const url = '/api/conversations?page=1&pageSize=50' + (q ? `&q=${encodeURIComponent(q)}` : '')
        const res = await fetch(url, { cache: 'no-store' })
        const data = await res.json()
        setItems(data.items ?? [])
        setLoading(false)
    }
    useEffect(() => { void load() }, [q])

    const pick = (id: string) => {
        localStorage.setItem(STORAGE_KEY, id)
        location.reload()
    }

    const createNew = async () => {
        const res = await fetch('/api/conversations', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New chat' })
        })
        const data = await res.json()
        if (data?.item?.id) {
            localStorage.setItem(STORAGE_KEY, data.item.id)
            location.reload()
        }
    }

    const rename = async (id: string) => {
        const title = prompt('Tên mới?')
        if (!title) return
        await fetch(`/api/conversations/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        })
        await load()
    }

    const remove = async (id: string) => {
        if (!confirm('Xoá hội thoại này?')) return
        await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
        const current = localStorage.getItem(STORAGE_KEY)
        if (current === id) localStorage.removeItem(STORAGE_KEY)
        await load()
    }

    return (
        <div>
            <div className="flex gap-2 mb-2">
                <input
                    className="w-full border rounded px-2 py-1"
                    placeholder="Tìm kiếm..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
                <button onClick={createNew} className="px-2 py-1 rounded bg-black text-white">Mới</button>
            </div>

            {loading ? (
                <div className="text-sm text-gray-500">Đang tải...</div>
            ) : (
                <ul className="space-y-2">
                    {items.map(it => (
                        <li key={it.id} className="border rounded p-2">
                            <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => pick(it.id)}>
                                    <div className="flex justify-between gap-2">
                                        <div className="truncate font-medium">{it.title}</div>
                                        <div className="text-xs text-gray-500 shrink-0">
                                            {new Date(it.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {it.messageCount} msgs · {it.lastPreview || '(trống)'}
                                    </div>
                                </div>

                                {}
                                <div className="shrink-0 flex items-center gap-1">
                                    <button
                                        onClick={() => rename(it.id)}
                                        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                                        title="Đổi tên"
                                    >
                                        Đổi tên
                                    </button>
                                    <button
                                        onClick={() => remove(it.id)}
                                        className="text-xs px-2 py-1 rounded border text-red-600 hover:bg-red-50"
                                        title="Xoá"
                                    >
                                        Xoá
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {items.length === 0 && <li className="text-sm text-gray-500">Chưa có hội thoại.</li>}
                </ul>
            )}
        </div>
    )
}
