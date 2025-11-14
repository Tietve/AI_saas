# File Upload Feature - Hỗ trợ PDF, Word, Excel

## 📋 Tổng quan

Đã nâng cấp tính năng upload file để hỗ trợ đầy đủ các loại tài liệu: PDF, Word, Excel với:
- ✅ File size validation theo từng loại
- ✅ Preview thumbnails với icons màu sắc
- ✅ Error handling chi tiết
- ✅ UI/UX đẹp mắt, responsive

## 🎯 Các file types được hỗ trợ

### Images
- JPEG, PNG, GIF, WebP
- **Max size:** 10MB

### PDF
- `.pdf` (application/pdf)
- **Max size:** 50MB
- **Icon:** 🔴 Red FileText

### Word Documents
- `.doc` (application/msword)
- `.docx` (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- **Max size:** 25MB
- **Icon:** 🔵 Blue FileText

### Excel Spreadsheets
- `.xls` (application/vnd.ms-excel)
- `.xlsx` (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
- **Max size:** 25MB
- **Icon:** 🟢 Green FileSpreadsheet

### Text Files
- `.txt` (text/plain)
- **Max size:** 25MB

## 🔧 Các thay đổi kỹ thuật

### 1. API Route: `/api/upload/route.ts`

**Cập nhật:**
- Thêm `FILE_SIZE_LIMITS` với giới hạn riêng cho từng loại file
- Thêm `ALLOWED_TYPES` mapping MIME types
- Thêm `validateFile()` function kiểm tra type và size
- Cải thiện error handling với detailed error messages
- Lưu documents locally (không dùng CDN cho PDF/Word/Excel)

```typescript
const FILE_SIZE_LIMITS = {
    image: 10 * 1024 * 1024,      // 10MB
    pdf: 50 * 1024 * 1024,        // 50MB
    document: 25 * 1024 * 1024,   // 25MB
    default: 10 * 1024 * 1024
}
```

### 2. ChatInput Component: `src/components/chat-v2/ChatInput.tsx`

**Cập nhật:**
- Thêm accept attribute cho tất cả file types
- Thêm `getFileIcon()` helper function để hiển thị icon phù hợp
- Thêm `formatFileSize()` helper function
- Cập nhật UI attachment preview với file size và icons

**Features mới:**
```tsx
// Icon theo loại file với màu sắc phù hợp
<FileText style={{ color: '#e74c3c' }} /> // PDF - Red
<FileSpreadsheet style={{ color: '#27ae60' }} /> // Excel - Green
<FileText style={{ color: '#3498db' }} /> // Word - Blue
```

### 3. useChat Hook: `src/hooks/chat/useChat.ts`

**Cập nhật:**
- Xóa hardcoded MAX_SIZE validation
- Cải thiện error handling để hiển thị lỗi từ API
- Hỗ trợ partial success (một số file thành công, một số thất bại)

### 4. MessageBubble Component: `src/components/chat-v2/MessageBubble.tsx`

**Cập nhật:**
- Thêm file card UI cho documents
- Hiển thị file icon, tên, size
- Thêm download icon
- Hover effects

### 5. CSS Styles: `src/styles/components/chat/*.module.css`

**Files cập nhật:**
- `input.module.css` - Attachment preview styles
- `messages.module.css` - File card styles

**New classes:**
- `.attachmentFileCard` - Document card container
- `.fileIcon` - Icon container với background
- `.fileInfo` - File name và size
- `.downloadIcon` - Download indicator

## 📦 Dependencies mới

```json
{
  "file-type": "^21.0.0",
  "mammoth": "^1.11.0",
  "pdf-parse": "^1.1.1",
  "xlsx": "^0.18.5"
}
```

## 🎨 UI/UX Improvements

### Attachment Preview (Input)
```
┌────────────────────────────────┐
│ 📄 document.pdf        5.2 MB  │
│ 📊 data.xlsx          1.3 MB   │
│ 📝 report.docx        2.1 MB   │
└────────────────────────────────┘
```

### File Card (Message)
```
┌──────────────────────────────────┐
│  ┌──┐  report.pdf                │
│  │📄│  5.2 MB            ⬇        │
│  └──┘                             │
└──────────────────────────────────┘
```

## 🧪 Testing

### Manual Testing
1. Upload PDF file < 50MB ✅
2. Upload Word doc < 25MB ✅
3. Upload Excel file < 25MB ✅
4. Upload file vượt quá size limit ✅
5. Upload unsupported file type ✅
6. Upload multiple files cùng lúc ✅
7. Remove attachment trước khi gửi ✅

### Error Messages
- ✅ "Loại file không được hỗ trợ: [type]"
- ✅ "File quá lớn. Kích thước tối đa cho [category]: [size]MB"
- ✅ "Không file nào được upload thành công"
- ✅ "Một số file không upload được: [details]"

## 🚀 Deployment Notes

1. Đảm bảo folder `public/uploads` có write permission
2. Check disk space cho việc lưu documents
3. Consider adding cleanup job cho old files
4. Monitor file upload bandwidth

## 📝 Future Improvements

- [ ] Thêm preview cho PDF files (iframe hoặc PDF viewer)
- [ ] Extract text từ Word/Excel để AI có thể đọc nội dung
- [ ] Compress documents trước khi lưu
- [ ] Add progress bar cho large file uploads
- [ ] Implement file virus scanning
- [ ] Add drag & drop support
- [ ] Cloud storage integration (S3, Google Cloud)

## 🔒 Security Considerations

- ✅ File type validation (MIME type check)
- ✅ File size limits
- ✅ Unique file names (UUID)
- ⚠️ TODO: Add virus scanning
- ⚠️ TODO: Rate limiting for uploads
- ⚠️ TODO: User storage quotas

## 📊 File Structure

```
src/
├── app/api/upload/
│   └── route.ts              # Upload API với validation
├── components/chat-v2/
│   ├── ChatInput.tsx         # Upload UI với preview
│   └── MessageBubble.tsx     # Display attachments
├── hooks/chat/
│   └── useChat.ts            # Upload logic
└── styles/components/chat/
    ├── input.module.css      # Input styles
    └── messages.module.css   # Message styles
```

---

**Tác giả:** Claude + Developer
**Ngày:** 2025-10-01
**Version:** 1.0.0
