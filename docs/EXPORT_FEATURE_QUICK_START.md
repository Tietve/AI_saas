# 🚀 Export Feature - Quick Start

## ✨ Nút Download đã được thêm!

Nút **Download** (xuất hội thoại) đã được tích hợp vào **ChatHeader**.

### 📍 Vị trí:
```
Header (góc phải) → Nút Download (icon 📥)
```

Nút sẽ chỉ hiện khi:
- ✅ Có ít nhất 1 tin nhắn trong hội thoại
- ✅ Đang xem một conversation cụ thể

---

## 🎯 Cách sử dụng:

### **1. Export đơn lẻ:**

1. Mở app: `http://localhost:3000/chat`
2. Tạo hoặc mở một hội thoại
3. Gửi vài tin nhắn (có thể dùng tiếng Việt)
4. Click nút **Download** ở góc phải header
5. Chọn format:
   - 📝 **Markdown** - Text dễ đọc
   - 📦 **JSON** - Dữ liệu đầy đủ
   - 🌐 **HTML** - Trang web có styling
   - 📄 **PDF** - Tài liệu chuyên nghiệp (mất vài giây)

### **2. Export hàng loạt:**

Component `BatchExportMenu` đã được tạo nhưng chưa được tích hợp vào sidebar.

**Để thêm vào sidebar:**
```tsx
// Trong ChatSidebar hoặc nơi hiển thị danh sách conversations
import { BatchExportMenu } from './BatchExportMenu'

<BatchExportMenu
  conversations={conversations}
  getConversationMessages={async (id) => {
    const res = await fetch(`/api/conversations/${id}/messages`)
    return (await res.json()).messages
  }}
/>
```

---

## 📝 Test với tiếng Việt:

1. Gửi tin nhắn:
   ```
   Xin chào! Đây là tin nhắn có dấu thanh điệu.
   Các dấu: á à ả ã ạ, ố ồ ổ ỗ ộ
   ```

2. Export ra PDF/Markdown

3. Mở file và kiểm tra:
   - ✅ Tất cả dấu hiển thị đúng
   - ✅ Timestamp theo format vi-VN
   - ✅ Layout đẹp và dễ đọc

---

## 🔧 Files đã tạo/sửa:

### **Core Library:**
- ✅ `src/lib/export/exportUtils.ts` - Export logic

### **Components:**
- ✅ `src/components/chat-v2/ExportMenu.tsx` - Single export menu
- ✅ `src/components/chat-v2/BatchExportMenu.tsx` - Batch export modal
- ✅ `src/components/chat-v2/ChatHeader.tsx` - **Đã thêm nút Download**

### **Styling:**
- ✅ `src/styles/components/chat/export.module.css`
- ✅ `src/styles/components/chat/batch-export.module.css`

### **Integration:**
- ✅ `src/app/chat/page.tsx` - Pass messages to ChatHeader

### **Documentation:**
- ✅ `docs/EXPORT_FEATURE.md` - Hướng dẫn chi tiết

---

## 🐛 Troubleshooting:

### **Không thấy nút Download:**
- Kiểm tra: Có tin nhắn trong conversation chưa?
- Refresh page: `Ctrl + R`
- Check console: `F12` → Console tab

### **PDF export chậm:**
- Bình thường! PDF cần 5-10 giây với 20+ messages
- Loading spinner sẽ hiển thị

### **Dấu tiếng Việt bị lỗi:**
- Kiểm tra: File `layout.tsx` có `<meta charSet="UTF-8" />` chưa?
- Browser encoding: Right click → Encoding → UTF-8

---

## 📸 Screenshot vị trí nút:

```
┌─────────────────────────────────────────────────┐
│ [☰] [Bot Selector] [Model Selector]   [🎨][📥][⚙️] │ ← Nút Download ở đây
├─────────────────────────────────────────────────┤
│                                                 │
│  Messages...                                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ Next Steps:

1. ✅ **Đã hoàn thành**: Single export trong ChatHeader
2. 🔲 **Optional**: Thêm BatchExportMenu vào Sidebar
3. 🔲 **Optional**: Thêm export formats khác (DOCX, TXT)
4. 🔲 **Optional**: Cloud export (Google Drive, Dropbox)

---

## 💡 Tips:

- **Markdown**: Tốt nhất để copy-paste vào notes
- **JSON**: Tốt nhất để backup/restore data
- **HTML**: Tốt nhất để archive và xem lại
- **PDF**: Tốt nhất để share và print

---

## 🎉 Enjoy!

Nút Download đã sẵn sàng. Mở app và test thử ngay! 🚀
