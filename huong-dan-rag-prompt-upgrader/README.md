# 📚 HƯỚNG DẪN XÂY DỰNG RAG PROMPT UPGRADER

> **Bộ giáo trình hoàn chỉnh** để xây dựng hệ thống AI nâng cấp prompt tự động
> **Dành cho:** Người mới bắt đầu học AI/ML
> **Thời gian:** 2-3 tuần
> **Cập nhật:** 2025-01-06

---

## 🎯 GIỚI THIỆU

Thư mục này chứa **5 bài hướng dẫn chi tiết** về cách xây dựng một hệ thống AI sử dụng RAG (Retrieval-Augmented Generation) để tự động nâng cấp user prompts.

### Hệ thống sẽ làm gì?

**Input:** Prompt đơn giản từ user
```
"Tóm tắt văn bản này"
```

**Output:** Prompt chuyên nghiệp, chi tiết
```
"Bạn là một chuyên gia phân tích văn bản. Hãy tóm tắt văn bản sau
thành 3-5 câu, tập trung vào các ý chính và thông điệp cốt lõi.
Sử dụng ngôn ngữ đơn giản, dễ hiểu. Trả về dưới dạng bullet points."
```

---

## 📖 CẤU TRÚC BÀI HỌC

### 🎓 Bắt đầu từ đây:

**1. [COMPLETE_ROADMAP.md](./COMPLETE_ROADMAP.md)** - ⭐ ĐỌC TRƯỚC TIÊN
- Tổng quan toàn bộ hệ thống
- Lộ trình học từng bước
- Checklist theo ngày
- FAQ & Tips

### 📚 Các bước chi tiết:

**2. [GUIDE_STEP_1_KNOWLEDGE_BASE.md](./GUIDE_STEP_1_KNOWLEDGE_BASE.md)**
- 📚 Xây dựng thư viện tài liệu về Prompt Engineering
- Lưu trữ 100-200 documents
- Code mẫu với TypeScript + Prisma
- **Thời gian:** 2-3 ngày

**3. [GUIDE_STEP_2_EMBEDDING.md](./GUIDE_STEP_2_EMBEDDING.md)**
- 🔢 Chuyển text thành vectors (embeddings)
- Sử dụng OpenAI Embedding API
- Tính similarity giữa các documents
- **Thời gian:** 2 ngày

**4. [GUIDE_STEP_3_VECTOR_STORE.md](./GUIDE_STEP_3_VECTOR_STORE.md)**
- 💾 Lưu trữ và tìm kiếm vectors
- So sánh pgvector vs Qdrant
- Tìm kiếm tài liệu liên quan < 100ms
- **Thời gian:** 2-3 ngày

**5. [GUIDE_STEP_4_PROMPT_UPGRADER.md](./GUIDE_STEP_4_PROMPT_UPGRADER.md)**
- 🤖 Xây dựng AI Agent hoàn chỉnh
- Kết nối RAG + GPT-4
- API Integration
- **Thời gian:** 3-4 ngày

---

## 🚀 QUICK START

### Bước 1: Đọc tổng quan
```bash
# Mở file này trước:
COMPLETE_ROADMAP.md
```

### Bước 2: Theo dõi từng bước
```bash
# Đọc và làm theo thứ tự:
GUIDE_STEP_1_KNOWLEDGE_BASE.md    # Ngày 1-3
GUIDE_STEP_2_EMBEDDING.md         # Ngày 3-5
GUIDE_STEP_3_VECTOR_STORE.md      # Ngày 5-8
GUIDE_STEP_4_PROMPT_UPGRADER.md   # Ngày 8-12
```

### Bước 3: Chạy code
```bash
# Các bước cơ bản:
npm install
npx prisma migrate dev
npx tsx scripts/create-knowledge-base.ts
npx tsx scripts/embed-knowledge-base.ts
npx tsx scripts/test-upgrader.ts
```

---

## 🎓 KẾT QUẢ HỌC ĐƯỢC

### Kiến thức:
✅ RAG (Retrieval-Augmented Generation)
✅ Vector Embeddings & Similarity Search
✅ Prompt Engineering principles
✅ AI Agent Architecture
✅ TypeScript + Node.js + PostgreSQL

### Kỹ năng:
✅ Xây dựng AI system từ đầu đến cuối
✅ Tích hợp OpenAI API
✅ Database design & optimization
✅ Production-ready code

### Sản phẩm:
✅ Một hệ thống AI hoàn chỉnh
✅ REST API có thể deploy
✅ Knowledge base về Prompt Engineering
✅ Portfolio project đẹp

---

## 🛠️ YÊU CẦU KỸ THUẬT

### Kiến thức nền tảng (Nice to have):
- JavaScript/TypeScript cơ bản
- Node.js + Express
- SQL cơ bản
- Git basics

### Không biết cũng OK!
Các guides giải thích rất chi tiết, code mẫu đầy đủ. Bạn có thể học trong quá trình làm.

### Tools cần cài:
```bash
# Required:
- Node.js (v18+)
- PostgreSQL (v14+)
- Git

# Optional:
- Docker (nếu dùng Qdrant)
- VS Code (hoặc editor khác)
```

---

## 📊 CẤU TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────┐
│   AI PROMPT UPGRADER SYSTEM             │
├─────────────────────────────────────────┤
│                                         │
│  📚 Knowledge Base                      │
│  └─ 100-200 docs về Prompt Engineering │
│                                         │
│  🔢 Embedding Service                   │
│  └─ OpenAI text-embedding-3-small      │
│                                         │
│  💾 Vector Store                        │
│  └─ pgvector / Qdrant                  │
│                                         │
│  🔍 RAG Retriever                       │
│  └─ Tìm docs liên quan                 │
│                                         │
│  🤖 Prompt Upgrader Agent               │
│  └─ GPT-4 + RAG context                │
│                                         │
│  🌐 REST API                            │
│  └─ POST /api/upgrade-prompt           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 💡 TIPS CHO NGƯỜI MỚI

### 1. Đọc tuần tự
Đừng skip bước nào! Mỗi bước xây dựng trên bước trước.

### 2. Code thực hành
Copy-paste code, chạy thử, hiểu nó hoạt động thế nào.

### 3. Debug từng bước
Test sau mỗi bước. Đừng đợi đến cuối mới test tất cả.

### 4. Đặt câu hỏi
Có gì không hiểu → Google / ChatGPT / Hỏi mentor

### 5. Start small
Tạo 10 docs trước, test OK, rồi mới scale lên 100-200 docs.

---

## 🐛 TROUBLESHOOTING

### "Không tìm thấy file X"
→ Đảm bảo đang ở đúng thư mục:
```bash
cd D:\my-saas-chat\huong-dan-rag-prompt-upgrader
```

### "Lỗi khi chạy code"
→ Xem phần "Common Errors" trong mỗi guide

### "Không hiểu khái niệm Y"
→ Mỗi guide có phần giải thích bằng ví dụ đơn giản

---

## 📞 HỖ TRỢ

Nếu gặp khó khăn:

1. ✅ Đọc lại phần giải thích trong guide
2. ✅ Check "Common Errors & Fixes" trong COMPLETE_ROADMAP.md
3. ✅ Google error message
4. ✅ Hỏi ChatGPT/Claude
5. ✅ Tạo issue trên GitHub (nếu có)

---

## 🎯 MỤC TIÊU

Sau khi hoàn thành bộ guides này, bạn sẽ:

✅ **Hiểu rõ** RAG và cách nó hoạt động
✅ **Có thể xây dựng** AI systems tương tự
✅ **Áp dụng được** cho các dự án khác
✅ **Tự tin** làm việc với AI/ML APIs
✅ **Có một portfolio project** đẹp để show

---

## 📚 TÀI LIỆU THAM KHẢO BỔ SUNG

### Official Docs
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [OpenAI Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
- [Prisma Docs](https://www.prisma.io/docs)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Qdrant Docs](https://qdrant.tech/documentation/)

### Research Papers
- [RAG Paper](https://arxiv.org/abs/2005.11401)
- [Chain-of-Thought](https://arxiv.org/abs/2201.11903)

### Community
- [Awesome ChatGPT Prompts](https://github.com/f/awesome-chatgpt-prompts)
- [LangChain](https://python.langchain.com/)

---

## 📝 NOTES

### Cập nhật lần cuối: 2025-01-06

### Contributors:
- Claude (AI Teacher) 🤖
- Bạn (Student) 👨‍🎓

### License:
Free to use for learning purposes!

---

**🚀 CHÚC BẠN HỌC TẬP VUI VẺ VÀ THÀNH CÔNG!**

Remember: *"The best way to learn is by doing!"* 💪

---

## 🗂️ DANH SÁCH FILE

```
huong-dan-rag-prompt-upgrader/
├── README.md (file này)
├── COMPLETE_ROADMAP.md (Đọc trước tiên!)
├── GUIDE_STEP_1_KNOWLEDGE_BASE.md
├── GUIDE_STEP_2_EMBEDDING.md
├── GUIDE_STEP_3_VECTOR_STORE.md
└── GUIDE_STEP_4_PROMPT_UPGRADER.md
```

---

**BẮT ĐẦU NGAY:** Mở file [COMPLETE_ROADMAP.md](./COMPLETE_ROADMAP.md) 🎯
