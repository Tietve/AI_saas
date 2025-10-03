# Conversation Management Feature

## Tổng quan

Tính năng quản lý hội thoại (Conversation Management) cho phép người dùng:
- ✅ **Tạo/Xóa hội thoại** (Create/Delete conversations)
- ✅ **Đổi tên hội thoại** (Rename conversations)
- ✅ **Ghim hội thoại quan trọng** (Pin important chats)

## Cài đặt

### 1. Cập nhật Database Schema

Đầu tiên, chạy lệnh để đồng bộ schema với database:

```bash
npx prisma db push
```

Hoặc nếu bạn muốn tạo migration:

```bash
npx prisma migrate dev --name add_conversation_pinned
```

### 2. Cấu trúc Files

#### Backend APIs
- `src/app/api/conversations/route.ts` - GET (list), POST (create)
- `src/app/api/conversations/[id]/route.ts` - GET, PATCH, DELETE
- `src/app/api/conversations/[id]/rename/route.ts` - POST (rename)
- `src/app/api/conversations/[id]/pin/route.ts` - POST (toggle pin) ⭐ **MỚI**

#### Frontend Components
- `src/hooks/chat/useConversations.ts` - Hook quản lý state và API calls
- `src/components/chat-v2/ChatSidebar.tsx` - UI component với context menu
- `src/styles/components/chat/sidebar.module.css` - Styles

#### Types
- `src/components/chat/shared/types.ts` - TypeScript types

## Sử dụng

### Trong Chat Page

```tsx
import { useConversations } from '@/hooks/chat/useConversations'
import { ChatSidebar } from '@/components/chat-v2/ChatSidebar'

export default function ChatPage() {
    const {
        conversations,
        filteredConversations,
        currentConversationId,
        setCurrentConversationId,
        searchQuery,
        setSearchQuery,
        createNewConversation,
        deleteConversation,
        updateConversationTitle,
        togglePin  // ⭐ Hàm mới
    } = useConversations()

    const handleRename = async (id: string, newTitle: string) => {
        try {
            await fetch(`/api/conversations/${id}/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            })
            updateConversationTitle(id, newTitle)
        } catch (error) {
            console.error('Rename failed:', error)
        }
    }

    return (
        <ChatSidebar
            isOpen={sidebarOpen}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            conversations={filteredConversations}
            currentConversationId={currentConversationId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectConversation={setCurrentConversationId}
            onCreateNew={createNewConversation}
            onDeleteConversation={deleteConversation}
            onRenameConversation={handleRename}  // ⭐ Prop mới
            onTogglePin={togglePin}              // ⭐ Prop mới
        />
    )
}
```

## Features Chi tiết

### 1. Create/Delete Conversations

**Tạo mới:**
- Click nút "New chat" ở header sidebar
- Hội thoại mới sẽ được tạo và tự động chọn

**Xóa:**
- Hover vào conversation item
- Click icon "..." (More actions)
- Chọn "Delete"
- Confirm trong dialog

### 2. Rename Conversations

**Cách 1: Context menu**
- Hover vào conversation item
- Click icon "..." (More actions)
- Chọn "Rename"
- Nhập tên mới và nhấn Enter (hoặc click ra ngoài)

**Keyboard shortcuts:**
- Enter: Lưu tên mới
- Escape: Hủy rename

### 3. Pin Important Chats ⭐ MỚI

**Toggle pin:**
- Hover vào conversation item
- Click icon "..." (More actions)
- Chọn "Pin" hoặc "Unpin"

**Hiển thị:**
- Conversations được pin sẽ có icon 📌 bên cạnh title
- Background color nhạt để highlight
- Tự động sắp xếp lên đầu danh sách

**Sorting logic:**
```
1. Pinned conversations (sorted by updatedAt DESC)
2. Unpinned conversations (sorted by updatedAt DESC)
```

## API Reference

### POST /api/conversations/:id/pin

Toggle pin status của conversation.

**Request:**
```bash
POST /api/conversations/clx123abc/pin
```

**Response:**
```json
{
  "item": {
    "id": "clx123abc",
    "title": "Important Chat",
    "pinned": true,
    "updatedAt": "2025-10-01T10:30:00.000Z"
  }
}
```

**Errors:**
- 404: Conversation not found
- 401: Unauthorized
- 400: Bad request

## Database Schema

```prisma
model Conversation {
  id           String   @id @default(cuid())
  userId       String
  title        String?  @db.VarChar(200)
  systemPrompt String?
  meta         Json?
  botId        String?
  pinned       Boolean  @default(false)  // ⭐ Field mới
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  model        String   @default("gpt-4o-mini")

  // Relations...

  @@index([userId, pinned, updatedAt(sort: Desc)])  // ⭐ Index mới
}
```

## Styling Customization

Trong file `sidebar.module.css`, bạn có thể tùy chỉnh:

```css
/* Màu background của pinned conversation */
.conversationItem.pinned {
    background: color-mix(in srgb, var(--color-brand-primary) 5%, transparent);
}

/* Icon pin */
.pinnedIcon {
    color: var(--color-brand-primary);
}

/* Context menu */
.contextMenu {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-light);
    box-shadow: var(--shadow-lg);
}
```

## Testing

Sau khi implement xong, test các scenarios:

1. ✅ Tạo conversation mới
2. ✅ Đổi tên conversation (Enter để save, Escape để cancel)
3. ✅ Pin conversation (kiểm tra sắp xếp lên đầu)
4. ✅ Unpin conversation
5. ✅ Xóa conversation
6. ✅ Search conversations (pinned vẫn ưu tiên)
7. ✅ Refresh page (pinned state được persist)

## Troubleshooting

**Database schema error:**
```bash
Error: Unknown field 'pinned' on model 'Conversation'
```
→ Chạy `npx prisma db push` để sync schema

**Pin không persist sau refresh:**
→ Kiểm tra API GET có trả về field `pinned` không

**Context menu bị hidden:**
→ Kiểm tra z-index trong CSS, đảm bảo `z-index: var(--z-50)`

## Next Steps

Các tính năng có thể mở rộng:
- 🔄 Bulk actions (pin/unpin/delete nhiều conversations)
- 🏷️ Tags/Labels cho conversations
- 📁 Folders/Categories
- 🔍 Advanced search (by model, date range, etc.)
- 📤 Export conversations to different formats
- ⭐ Favorite/Star conversations (khác với pin)

---

**Ghi chú:** Feature này tương thích với tất cả browsers hiện đại và responsive trên mobile.
