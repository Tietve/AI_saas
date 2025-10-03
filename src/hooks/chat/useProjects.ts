import { useState, useEffect } from 'react'

export interface Project {
    id: string
    name: string
    description?: string
    color?: string
    icon?: string
    conversationCount?: number
    createdAt: string
    updatedAt: string
}

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function loadProjects() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/projects', {
                credentials: 'include',
                cache: 'no-store'
            })
            if (!res.ok) {
                if (res.status === 401) return
                throw new Error('Failed to load projects')
            }
            const data = await res.json()
            setProjects(data.items || [])
        } catch (error) {
            console.error('[Projects] Load error:', error)
            setError('Không thể tải projects')
        } finally {
            setLoading(false)
        }
    }

    async function createProject(name: string, description?: string, color?: string) {
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, color })
            })
            if (!res.ok) throw new Error('Failed to create project')
            const data = await res.json()
            await loadProjects()
            return data.item.id
        } catch (error) {
            console.error('[Create Project] Error:', error)
            setError('Không thể tạo project')
            return null
        }
    }

    async function updateProject(id: string, updates: Partial<Project>) {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (!res.ok) throw new Error('Failed to update project')
            await loadProjects()
        } catch (error) {
            console.error('[Update Project] Error:', error)
            setError('Không thể cập nhật project')
        }
    }

    async function deleteProject(id: string) {
        if (!confirm('Xóa project này? (Conversations sẽ được giữ lại)')) return
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Failed to delete')
            await loadProjects()
        } catch (error) {
            console.error('[Delete Project] Error:', error)
            setError('Không thể xóa project')
        }
    }

    useEffect(() => {
        loadProjects()
    }, [])

    return {
        projects,
        loading,
        error,
        createProject,
        updateProject,
        deleteProject,
        loadProjects
    }
}
