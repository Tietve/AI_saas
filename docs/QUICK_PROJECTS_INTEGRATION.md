# Quick Integration Guide - Projects Feature

## Đã hoàn thành ✅

1. ✅ Database schema (projectId field)
2. ✅ Backend APIs
3. ✅ Hook `useProjects`
4. ✅ Context menu với "Add to project" + submenu
5. ✅ CSS styles

## Integration vào Chat Page

### Bước 1: Import và sử dụng useProjects

Trong file `src/app/chat/page.tsx`, thêm:

```typescript
import { useProjects } from '@/hooks/chat/useProjects'

export default function ChatPage() {
    // ... existing code ...

    // ← THÊM DÒNG NÀY
    const { projects } = useProjects()

    // ... rest of code ...
}
```

### Bước 2: Thêm handler để assign conversation to project

```typescript
async function handleAddToProject(conversationId: string, projectId: string | null) {
    try {
        const res = await fetch(`/api/conversations/${conversationId}/project`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
        })
        if (!res.ok) throw new Error('Failed to add to project')

        // Reload conversations để cập nhật projectId
        // Giả sử bạn có hàm loadConversations từ useChat hoặc useConversations
        // loadConversations()

        console.log('Added to project successfully')
    } catch (error) {
        console.error('[Add to Project] Error:', error)
        setError('Không thể thêm vào project')
    }
}
```

### Bước 3: Truyền props vào ChatSidebar

Tìm dòng `<ChatSidebar .../>` và thêm 2 props:

```typescript
<ChatSidebar
    // ... existing props ...
    projects={projects}  // ← THÊM DÒNG NÀY
    onAddToProject={handleAddToProject}  // ← THÊM DÒNG NÀY
/>
```

## Test ngay!

1. Tạo project đầu tiên bằng Postman hoặc curl:

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Web Development",
    "color": "#3b82f6"
  }' \
  --cookie-jar cookies.txt
```

2. Reload trang chat
3. Hover vào conversation → Click "..." → Thấy "Add to project"
4. Click vào sẽ hiện submenu với list projects

## Tạo UI để Create Project (Optional - làm sau)

Nếu muốn UI đầy đủ như Claude, cần:

1. Tạo modal `CreateProjectModal` (có trong file `PROJECTS_FEATURE.md`)
2. Thêm nút "New Project" ở sidebar
3. Tạo ProjectSelector component để filter conversations theo project

Nhưng hiện tại bạn đã có thể **assign conversations vào projects** qua context menu rồi! 🎉

---

## Full Code Example cho page.tsx

```typescript
'use client'

import { useProjects } from '@/hooks/chat/useProjects'
// ... existing imports ...

export default function ChatPage() {
    // ... existing states ...
    const [error, setError] = useState<string | null>(null)

    // Existing hooks
    const { ... } = useChat({ ... })

    // NEW: Projects hook
    const { projects } = useProjects()

    // NEW: Handler
    async function handleAddToProject(conversationId: string, projectId: string | null) {
        try {
            const res = await fetch(`/api/conversations/${conversationId}/project`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            })
            if (!res.ok) throw new Error('Failed')
            // Optionally reload conversations
        } catch (error) {
            console.error('[Add to Project] Error:', error)
            setError?.('Không thể thêm vào project')
        }
    }

    return (
        <div className={styles.chatContainer}>
            <ChatSidebar
                // ... existing props ...
                projects={projects}
                onAddToProject={handleAddToProject}
            />
            {/* ... rest */}
        </div>
    )
}
```

**Chỉ cần thêm 3 dòng code và bạn đã có Projects feature! 🚀**
