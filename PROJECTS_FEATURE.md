# Projects Feature - Tổ chức conversations theo workspace

## Tổng quan

Tính năng **Projects** giống Claude - cho phép người dùng tổ chức conversations theo dự án/workspace để dễ quản lý.

## ✅ Đã hoàn thành

### 1. Database Schema
- ✅ Tạo model `Project` với fields: name, description, color, icon
- ✅ Thêm `projectId` vào `Conversation`
- ✅ Relation: `Project` has many `Conversations`
- ✅ onDelete: SetNull (khi xóa project, conversations vẫn giữ lại nhưng projectId = null)

### 2. API Endpoints
- ✅ `GET /api/projects` - List all projects
- ✅ `POST /api/projects` - Create project
- ✅ `GET /api/projects/:id` - Get project detail
- ✅ `PATCH /api/projects/:id` - Update project
- ✅ `DELETE /api/projects/:id` - Delete project
- ✅ `GET /api/conversations?projectId=xxx` - Filter conversations by project

## 🔨 Cần hoàn thành

### 3. Frontend - Types & Hooks

**File: `src/components/chat/shared/types.ts`**
```typescript
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

export interface Conversation {
    id: string
    title: string
    projectId?: string  // ← Thêm field này
    updatedAt: string
    messageCount?: number
    model?: string
    botId?: string
    pinned?: boolean
}
```

**File: `src/hooks/chat/useProjects.ts`** (Tạo mới)
```typescript
import { useState, useEffect } from 'react'
import { Project } from '@/components/chat/shared/types'

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function loadProjects() {
        setLoading(true)
        try {
            const res = await fetch('/api/projects', {
                credentials: 'include',
                cache: 'no-store'
            })
            if (!res.ok) throw new Error('Failed to load projects')
            const data = await res.json()
            setProjects(data.items || [])
        } catch (error) {
            console.error('[Projects] Load error:', error)
            setError('Không thể tải danh sách projects')
        } finally {
            setLoading(false)
        }
    }

    async function createProject(name: string, description?: string, color?: string, icon?: string) {
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, color, icon })
            })
            if (!res.ok) throw new Error('Failed to create project')
            await loadProjects()
        } catch (error) {
            console.error('[Create Project] Error:', error)
            setError('Không thể tạo project')
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
```

### 4. UI Components

**File: `src/components/chat-v2/ProjectSelector.tsx`** (Tạo mới)
```typescript
import { FolderIcon, Plus } from 'lucide-react'
import { Project } from '@/components/chat/shared/types'
import styles from '@/styles/components/chat/projects.module.css'

interface ProjectSelectorProps {
    projects: Project[]
    selectedProjectId: string | null
    onSelectProject: (projectId: string | null) => void
    onCreateProject: () => void
}

export function ProjectSelector({
    projects,
    selectedProjectId,
    onSelectProject,
    onCreateProject
}: ProjectSelectorProps) {
    return (
        <div className={styles.projectSelector}>
            <div className={styles.projectHeader}>
                <span>Projects</span>
                <button onClick={onCreateProject} title="New project">
                    <Plus size={16} />
                </button>
            </div>

            {/* All Conversations */}
            <button
                className={`${styles.projectItem} ${!selectedProjectId ? styles.active : ''}`}
                onClick={() => onSelectProject(null)}
            >
                <FolderIcon size={16} />
                <span>All Conversations</span>
            </button>

            {/* Project List */}
            {projects.map(project => (
                <button
                    key={project.id}
                    className={`${styles.projectItem} ${selectedProjectId === project.id ? styles.active : ''}`}
                    onClick={() => onSelectProject(project.id)}
                    style={{ '--project-color': project.color } as any}
                >
                    <div
                        className={styles.projectIcon}
                        style={{ backgroundColor: project.color }}
                    >
                        {project.icon?.[0] || 'P'}
                    </div>
                    <div className={styles.projectInfo}>
                        <span className={styles.projectName}>{project.name}</span>
                        <span className={styles.projectCount}>
                            {project.conversationCount} chats
                        </span>
                    </div>
                </button>
            ))}
        </div>
    )
}
```

**File: `src/components/chat-v2/CreateProjectModal.tsx`** (Tạo mới)
```typescript
import { useState } from 'react'
import { X } from 'lucide-react'
import styles from '@/styles/components/chat/modal.module.css'

interface CreateProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (name: string, description?: string, color?: string) => void
}

const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
]

export function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState(COLORS[0])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        onCreate(name.trim(), description.trim() || undefined, color)
        setName('')
        setDescription('')
        setColor(COLORS[0])
        onClose()
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Create New Project</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label>Project Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Web Development"
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            rows={3}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Color</label>
                        <div className={styles.colorPicker}>
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`${styles.colorOption} ${color === c ? styles.selected : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={!name.trim()}>Create</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
```

### 5. Integration vào ChatSidebar

**Cập nhật `src/components/chat-v2/ChatSidebar.tsx`:**

```typescript
import { ProjectSelector } from './ProjectSelector'

// ... existing code ...

export function ChatSidebar({
    // ... existing props ...
    projects,  // ← Thêm prop
    selectedProjectId,  // ← Thêm prop
    onSelectProject,  // ← Thêm prop
    onCreateProject  // ← Thêm prop
}: ChatSidebarProps) {
    return (
        <>
            {/* ... overlay & menu ... */}

            <aside className={`${styles.sidebar} ...`}>
                {/* Header */}
                <div className={styles.sidebarHeader}>
                    <Button onClick={onCreateNew}>New chat</Button>
                </div>

                {/* Projects Section - MỚI */}
                <ProjectSelector
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={onSelectProject}
                    onCreateProject={onCreateProject}
                />

                {/* Search */}
                {/* ... existing search ... */}

                {/* Conversations List */}
                {/* ... existing list ... */}
            </aside>
        </>
    )
}
```

### 6. Integration vào Chat Page

**Cập nhật `src/app/chat/page.tsx`:**

```typescript
import { useProjects } from '@/hooks/chat/useProjects'
import { CreateProjectModal } from '@/components/chat-v2/CreateProjectModal'

export default function ChatPage() {
    // ... existing states ...
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)

    // Existing hooks
    const { ... } = useChat({ ... })

    // NEW: Projects hook
    const {
        projects,
        createProject,
        updateProject,
        deleteProject
    } = useProjects()

    // Filter conversations by project
    const filteredByProject = selectedProjectId
        ? filteredConversations.filter(c => c.projectId === selectedProjectId)
        : filteredConversations

    return (
        <div className={styles.chatContainer}>
            <ChatSidebar
                // ... existing props ...
                conversations={filteredByProject}  // ← Use filtered
                projects={projects}  // ← NEW
                selectedProjectId={selectedProjectId}  // ← NEW
                onSelectProject={setSelectedProjectId}  // ← NEW
                onCreateProject={() => setShowCreateProjectModal(true)}  // ← NEW
            />

            {/* ... rest of UI ... */}

            <CreateProjectModal
                isOpen={showCreateProjectModal}
                onClose={() => setShowCreateProjectModal(false)}
                onCreate={createProject}
            />
        </div>
    )
}
```

### 7. CSS Styles

**File: `src/styles/components/chat/projects.module.css`** (Tạo mới)

```css
/* Projects Section */
.projectSelector {
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-3);
}

.projectHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-2);
}

.projectHeader button {
    padding: var(--space-1);
    border: none;
    background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-200);
}

.projectHeader button:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
}

.projectItem {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    transition: all var(--transition-200);
    text-align: left;
    margin-bottom: var(--space-1);
}

.projectItem:hover {
    background: var(--color-bg-tertiary);
}

.projectItem.active {
    background: var(--color-bg-primary);
    font-weight: var(--font-medium);
}

.projectIcon {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
    color: white;
}

.projectInfo {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.projectName {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
}

.projectCount {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
}

/* Modal Styles */
.modalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.modalContent {
    background: var(--color-bg-primary);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    max-width: 500px;
    width: 90%;
    box-shadow: var(--shadow-xl);
}

.modalHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
}

.modalHeader h2 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
}

.modalForm {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
}

.formGroup label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    margin-bottom: var(--space-2);
}

.formGroup input,
.formGroup textarea {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
}

.colorPicker {
    display: flex;
    gap: var(--space-2);
}

.colorOption {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition-200);
}

.colorOption.selected {
    border-color: var(--color-text-primary);
    transform: scale(1.1);
}

.modalActions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
    margin-top: var(--space-4);
}
```

## 🚀 Các bước triển khai

1. **Migration database:**
```bash
npx prisma db push
```

2. **Restart dev server:**
```bash
npm run dev
```

3. **Tạo các files components theo hướng dẫn trên**

4. **Test tính năng:**
   - Tạo project mới
   - Gán conversation vào project
   - Filter conversations theo project
   - Xóa project (conversations vẫn giữ lại)

## 💡 Features nâng cao (Optional)

- [ ] Drag & drop conversation vào project
- [ ] Project templates
- [ ] Share project với team members (Multi-user)
- [ ] Export/Import project
- [ ] Project statistics & analytics
- [ ] Archived projects

---

**Note:** Tất cả code trên đã được thiết kế để tương thích với kiến trúc hiện tại của bạn. Chỉ cần follow từng bước và test kỹ!
