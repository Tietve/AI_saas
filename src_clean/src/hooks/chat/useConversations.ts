import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Conversation } from '@/components/chat/shared/types'
import { STORAGE_KEY } from '@/components/chat/shared/constants'

export function useConversations() {
    const router = useRouter()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredConversations = conversations.filter(conv =>
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    async function loadConversations() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/conversations?pageSize=50', {
                credentials: 'include',
                cache: 'no-store'
            })
            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/auth/signin')
                    return
                }
                throw new Error('Failed to load conversations')
            }
            const data = await res.json()
            setConversations(data.items || [])
            if (!currentConversationId && data.items?.length > 0) {
                setCurrentConversationId(data.items[0].id)
            }
        } catch (error) {
            console.error('[Conversations] Load error:', error)
            setError('Không thể tải danh sách hội thoại')
        } finally {
            setLoading(false)
        }
    }

    async function createNewConversation(params?: {
        systemPrompt?: string,
        model?: string,
        botId?: string
    }) {
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'New Chat',
                    systemPrompt: params?.systemPrompt,
                    model: params?.model,
                    botId: params?.botId
                })
            })
            if (!res.ok) throw new Error('Failed to create conversation')
            const data = await res.json()
            await loadConversations()
            setCurrentConversationId(data.item.id)
            return data.item.id
        } catch (error) {
            console.error('[Create] Error:', error)
            setError('Không thể tạo hội thoại mới')
            return null
        }
    }

    async function deleteConversation(id: string) {
        if (!confirm('Xóa hội thoại này?')) return
        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Failed to delete')
            await loadConversations()
            if (currentConversationId === id) {
                setCurrentConversationId(null)
            }
        } catch (error) {
            console.error('[Delete] Error:', error)
            setError('Không thể xóa hội thoại')
        }
    }

    useEffect(() => {
        loadConversations()
    }, [])

    return {
        conversations,
        filteredConversations,
        currentConversationId,
        setCurrentConversationId,
        searchQuery,
        setSearchQuery,
        loading,
        error,
        createNewConversation,
        deleteConversation,
        loadConversations
    }
}