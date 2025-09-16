'use client'

import { useEffect, useState } from 'react'

import { DEFAULT_MODEL_ID, MODELS_DISPLAY, isAllowedModel, normalizeModel, ALL_MODELS } from '@/lib/ai/models'

const STORAGE_KEY = 'chat.conversationId'

export default function ConversationSettings() {
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [systemPrompt, setSystemPrompt] = useState('')
    const [model, setModel] = useState<string>(DEFAULT_MODEL_ID)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [savedAt, setSavedAt] = useState<number | null>(null)

    useEffect(() => {
        const cid = localStorage.getItem(STORAGE_KEY)
        setConversationId(cid)
        if (cid) void fetchDetail(cid)
    }, [])

    async function fetchDetail(id: string) {
        setLoading(true); setError(null)
        const res = await fetch(`/api/conversations/${id}`, { cache: 'no-store' })
        if (!res.ok) {
            setError('Không tải được thông tin hội thoại.')
            setLoading(false)
            return
        }
        const data = await res.json()
        setSystemPrompt(data?.item?.systemPrompt ?? '')
        setModel(data?.item?.model || DEFAULT_MODEL_ID)
        setLoading(false)
    }

    async function save() {
        if (!conversationId) return
        setSaving(true); setError(null)
        const res = await fetch(`/api/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, model }),
        })
        if (!res.ok) {
            const msg = (await tryJson(res))?.error || `HTTP ${res.status}`
            setError(msg)
        } else {
            setSavedAt(Date.now())
        }
        setSaving(false)
    }

    // autosave sau 1s khi thay đổi
    useEffect(() => {
        if (!conversationId) return
        const t = setTimeout(() => { void save() }, 1000)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemPrompt, model, conversationId])

    if (!conversationId) {
        return (
            <div className="mb-3 border rounded p-3 bg-gray-50 text-sm text-gray-600">
                Tạo hội thoại mới (gửi tin) để chỉnh <b>System Prompt</b> và <b>Model</b>.
            </div>
        )
    }

    return (
        <div className="mb-3 border rounded p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Cấu hình hội thoại</div>
                <div className="text-xs text-gray-500">
                    {loading ? 'Đang tải...' :
                        saving ? 'Đang lưu...' :
                            savedAt ? `Đã lưu lúc ${new Date(savedAt).toLocaleTimeString()}` : ''}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <div className="md:col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">Model</label>
                    <select
                        className="w-full border rounded px-2 py-1"
                        value={model}
                        onChange={e => setModel(e.target.value)}
                    >
                        {ALL_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                    </select>
                    <div className="text-[11px] text-gray-500 mt-1">
                        Mặc định: <code>{DEFAULT_MODEL_ID}</code>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">System Prompt</label>
                    <textarea
                        className="w-full h-24 border rounded px-2 py-1 text-sm"
                        placeholder="VD: Bạn là trợ lý nói tiếng Việt, trả lời ngắn gọn..."
                        value={systemPrompt}
                        onChange={e => setSystemPrompt(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <button className="px-3 py-1 rounded border" onClick={() => void save()} disabled={saving || loading}>
                    Lưu
                </button>
                {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
        </div>
    )
}

async function tryJson(res: Response) { try { return await res.json() } catch { return null } }
