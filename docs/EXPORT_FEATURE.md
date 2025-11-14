# Export Conversations Feature

Tính năng xuất hội thoại với hỗ trợ đầy đủ tiếng Việt và nhiều định dạng.

## ✨ Tính năng

### 1. **Xuất đơn lẻ** (Single Export)
- ✅ Markdown (.md) - Định dạng text dễ đọc
- ✅ JSON (.json) - Dữ liệu đầy đủ có cấu trúc
- ✅ HTML (.html) - Trang web có styling đẹp
- ✅ PDF (.pdf) - Tài liệu chuyên nghiệp

### 2. **Xuất hàng loạt** (Batch Export)
- ✅ Chọn nhiều hội thoại cùng lúc
- ✅ Markdown/JSON: Gộp tất cả vào 1 file
- ✅ HTML/PDF: Mỗi hội thoại 1 file riêng

### 3. **Hỗ trợ tiếng Việt**
- ✅ UTF-8 encoding đầy đủ
- ✅ Font Inter với Vietnamese subset
- ✅ Format date theo locale vi-VN
- ✅ Dấu thanh điệu hiển thị chính xác

## 📦 Cài đặt

Libraries đã được cài đặt:
```bash
npm install jspdf jspdf-autotable html2canvas
```

## 🎯 Cách sử dụng

### Single Export

```tsx
import { ExportMenu } from '@/components/chat-v2/ExportMenu'

function ChatHeader({ messages, conversationTitle }) {
  return (
    <div className="chat-header">
      <h1>{conversationTitle}</h1>
      <ExportMenu
        messages={messages}
        conversationTitle={conversationTitle}
      />
    </div>
  )
}
```

### Batch Export

```tsx
import { BatchExportMenu } from '@/components/chat-v2/BatchExportMenu'

function Sidebar({ conversations }) {
  // Function to fetch messages for a conversation
  const getConversationMessages = async (conversationId: string) => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`)
    const data = await res.json()
    return data.messages
  }

  return (
    <div className="sidebar">
      <BatchExportMenu
        conversations={conversations}
        getConversationMessages={getConversationMessages}
      />
    </div>
  )
}
```

### Programmatic Export

```tsx
import {
  exportAsMarkdown,
  exportAsJSON,
  exportAsPDF,
  exportAsHTML,
  batchExport
} from '@/lib/export/exportUtils'

// Single export
const handleExport = async () => {
  await exportAsPDF(messages, {
    format: 'pdf',
    conversationTitle: 'My Chat',
    includeTimestamps: true,
    includeMetadata: true
  })
}

// Batch export
const handleBatchExport = async () => {
  await batchExport({
    format: 'markdown',
    conversations: [
      { id: '1', title: 'Chat 1', messages: [...] },
      { id: '2', title: 'Chat 2', messages: [...] }
    ],
    includeTimestamps: true,
    includeMetadata: true
  })
}
```

## 📄 Định dạng file xuất ra

### Markdown (.md)
```markdown
# Tên hội thoại

> **Xuất file:** 1 Tháng 10, 2025, 15:30
> **Số tin nhắn:** 10

---

### 👤 **Bạn** _(1 Tháng 10, 2025, 15:00)_

Xin chào! Bạn có thể giúp tôi không?

---

### 🤖 **Trợ lý AI** _(1 Tháng 10, 2025, 15:01)_

Chào bạn! Tôi sẵn sàng hỗ trợ bạn.
```

### JSON (.json)
```json
{
  "title": "Tên hội thoại",
  "exportDate": "2025-10-01T15:30:00.000Z",
  "messageCount": 10,
  "messages": [
    {
      "id": "msg1",
      "role": "USER",
      "content": "Xin chào!",
      "createdAt": "2025-10-01T15:00:00.000Z",
      "attachments": []
    }
  ]
}
```

### HTML (.html)
Trang web đầy đủ với:
- Styling đẹp mắt
- Dark mode support
- Print-friendly
- Vietnamese font rendering

### PDF (.pdf)
- A4 size
- Multi-page support
- Vietnamese text rendering
- Professional layout

## 🎨 Tùy chỉnh

### ExportOptions

```typescript
interface ExportOptions {
  format: 'pdf' | 'markdown' | 'json' | 'html'
  conversationTitle?: string      // Tên file
  includeTimestamps?: boolean     // Hiển thị thời gian
  includeMetadata?: boolean       // Hiển thị metadata
  theme?: 'light' | 'dark'        // Theme (cho HTML)
}
```

### BatchExportOptions

```typescript
interface BatchExportOptions extends ExportOptions {
  conversations: Array<{
    id: string
    title: string
    messages: Message[]
  }>
}
```

## 🔧 Styling

CSS modules được tách riêng:
- `export.module.css` - Single export menu
- `batch-export.module.css` - Batch export modal

Customize bằng cách override CSS variables:

```css
.exportMenu {
  --export-menu-width: 250px;
  --export-menu-bg: var(--color-bg-primary);
  --export-menu-border: var(--color-border-light);
}
```

## ⚡ Performance

### PDF Export
- Sử dụng `html2canvas` để render
- Có thể chậm với conversation dài (>100 messages)
- Hiển thị loading spinner trong quá trình export

### Batch Export
- Thêm 1s delay giữa các file PDF để tránh quá tải browser
- Markdown/JSON nhanh hơn vì không cần render

## 🧪 Testing

Test file đã tạo:
```bash
# Test encoding
node scripts/test-vietnamese-encoding.js

# Visual test
open test-vietnamese.html
```

Test trong app:
1. Tạo conversation với tiếng Việt
2. Thêm messages có dấu thanh điệu: á à ả ã ạ
3. Export các format: Markdown, JSON, HTML, PDF
4. Kiểm tra dấu hiển thị đúng

## 📝 TODO / Cải tiến tương lai

- [ ] Thêm export format: DOCX, TXT
- [ ] Compress multiple files vào ZIP
- [ ] Cloud export (Google Drive, Dropbox)
- [ ] Scheduled auto-export
- [ ] Export filters (date range, role, keywords)
- [ ] Custom templates cho HTML/PDF
- [ ] Preview trước khi export

## 🐛 Known Issues

1. **PDF export chậm**:
   - Với >50 messages có thể mất 5-10 giây
   - Workaround: Hiển thị progress indicator

2. **Vietnamese font trong PDF**:
   - Sử dụng html2canvas (render to image)
   - Font được preserve nhưng file size lớn hơn
   - Alternative: Sử dụng jsPDF với custom font (phức tạp hơn)

3. **File size**:
   - PDF thường 2-5MB với 20-30 messages
   - Markdown/JSON rất nhỏ (<100KB)

## 🤝 Contributing

Để thêm format mới:

1. Thêm type vào `ExportFormat`:
```typescript
export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'html' | 'your-format';
```

2. Implement export function:
```typescript
export function exportAsYourFormat(
  messages: Message[],
  options: ExportOptions
): void {
  // Your implementation
}
```

3. Thêm vào menu:
```tsx
<button onClick={() => handleExport('your-format')}>
  Your Format
</button>
```

## 📚 References

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [Vietnamese Unicode Guide](https://vi.wikipedia.org/wiki/B%E1%BA%A3ng_m%C3%A3_Unicode)
- [Inter Font with Vietnamese](https://fonts.google.com/specimen/Inter)

## 💡 Examples

Xem thêm examples tại:
- `src/components/chat-v2/ExportMenu.tsx`
- `src/components/chat-v2/BatchExportMenu.tsx`
- `src/lib/export/exportUtils.ts`
