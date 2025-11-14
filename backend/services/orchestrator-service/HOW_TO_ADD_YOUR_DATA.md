# 📝 Cách Thêm Dữ Liệu Của Bạn Vào Pinecone

> **TL;DR:** Edit file JSON → Run command → Done!

---

## 🎯 Dữ Liệu Nằm Ở Đâu?

Dữ liệu được lưu trong file **JSON** tại:

```
D:\my-saas-chat\backend\services\orchestrator-service\data\
```

Có 2 files:
1. **`sample-docs.json`** - 30 documents mẫu (technical topics)
2. **`MY_CUSTOM_DOCS.json`** - Template cho dữ liệu của BẠN

---

## 🚀 Cách 1: Dùng Dữ Liệu Mẫu (Nhanh Nhất)

Nếu bạn muốn test nhanh với 30 documents có sẵn:

```bash
cd D:\my-saas-chat\backend\services\orchestrator-service
npm run seed:docs
```

**Xong!** Pinecone giờ có 30 documents về:
- React optimization
- Database best practices
- Security tips
- API design
- Docker, Testing, etc.

---

## 📝 Cách 2: Thêm Dữ Liệu Của BẠN

### Bước 1: Mở file template

```bash
cd D:\my-saas-chat\backend\services\orchestrator-service
notepad data\MY_CUSTOM_DOCS.json
```

### Bước 2: Edit theo format này

```json
[
  {
    "content": "Đây là nội dung chính. Viết chi tiết những gì bạn muốn AI biết. Ví dụ: Project của tôi tên là ABC, sử dụng Node.js, TypeScript, có 3 services...",
    "title": "Tiêu đề ngắn gọn",
    "category": "my-project",
    "tags": ["tag1", "tag2"],
    "source": "my-knowledge",
    "language": "vietnamese"
  },
  {
    "content": "Document thứ 2 của bạn...",
    "title": "Document 2",
    "category": "deployment",
    "tags": ["docker", "guide"]
  }
]
```

**Giải thích:**
- **`content`** (BẮT BUỘC): Nội dung chính, RAG sẽ search trong này
- **`title`**: Tiêu đề document
- **`category`**: Phân loại (ví dụ: project, security, api)
- **`tags`**: Array của tags để dễ filter
- **`source`**: Nguồn (my-docs, company-wiki, etc.)
- **`language`**: Ngôn ngữ (vietnamese, english, etc.)

### Bước 3: Save và upload

```bash
npm run seed:my-docs
```

**Output:**
```
🌱 Uploading YOUR custom documents to Pinecone...
📚 Loaded 5 custom documents from MY_CUSTOM_DOCS.json
📋 Documents to upload:
   1. Document 1 Title (my-project)
   2. Document 2 Title (deployment)
   ...
🔮 Generating embeddings with OpenAI...
📤 Uploading to Pinecone...
🎉 YOUR custom documents are now in Pinecone!
```

---

## 💡 Ví Dụ Thực Tế

### Example 1: Kiến thức về project của bạn

```json
{
  "content": "My SaaS Chat là một project chat với AI. Có 5 microservices: auth-service (port 3001), chat-service (3003), billing-service (3004), analytics-service (3005), orchestrator-service (3006). Database dùng PostgreSQL, cache dùng Redis.",
  "title": "My SaaS Chat Architecture Overview",
  "category": "project-architecture",
  "tags": ["architecture", "microservices", "my-project"],
  "source": "project-docs",
  "language": "vietnamese"
}
```

### Example 2: Hướng dẫn deploy

```json
{
  "content": "Để deploy My SaaS Chat: 1) Chạy docker-compose up -d để start PostgreSQL và Redis. 2) Cài dependencies với npm install ở mỗi service. 3) Copy .env.example thành .env và điền API keys. 4) Chạy prisma migrate với npx prisma migrate dev. 5) Start services với npm run dev.",
  "title": "My Project Deployment Guide",
  "category": "deployment",
  "tags": ["deployment", "docker", "setup"],
  "source": "deployment-guide",
  "language": "vietnamese"
}
```

### Example 3: Code examples

```json
{
  "content": "Để tạo JWT token trong project này: const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' }). Refresh token expire sau 7 ngày. Store trong httpOnly cookie để security.",
  "title": "JWT Implementation in My Project",
  "category": "authentication",
  "tags": ["jwt", "auth", "security"],
  "source": "auth-docs",
  "language": "vietnamese"
}
```

---

## 🎨 Tips Viết Documents Tốt

### ✅ DO (Nên làm):
- **Chi tiết**: Viết cụ thể, đầy đủ thông tin
- **Context**: Thêm context để AI hiểu rõ
- **Examples**: Kèm ví dụ code nếu có
- **Structured**: Chia thành sections rõ ràng

### ❌ DON'T (Không nên):
- **Quá ngắn**: "Project dùng Node.js" → Không đủ info
- **Không context**: "Run npm install" → Không biết service nào
- **Duplicate**: Trùng lặp nội dung nhiều lần

### Ví Dụ:

**❌ BAD:**
```json
{
  "content": "Project dùng Node.js và TypeScript.",
  "title": "Tech stack"
}
```

**✅ GOOD:**
```json
{
  "content": "My SaaS Chat project sử dụng Node.js 18+ với TypeScript 5.x. Architecture là microservices với 5 services độc lập: auth-service để authentication (JWT tokens), chat-service để realtime chat với Socket.io, billing-service integrate với Stripe, analytics-service track metrics, và orchestrator-service để RAG và prompt enhancement. Database chính là PostgreSQL, cache layer dùng Redis, vector database dùng Pinecone.",
  "title": "My Project Tech Stack and Architecture",
  "category": "architecture",
  "tags": ["tech-stack", "architecture", "microservices", "nodejs", "typescript"],
  "source": "project-overview",
  "language": "vietnamese"
}
```

---

## 📊 Check Kết Quả

### 1. Kiểm tra số lượng documents

```bash
curl http://localhost:3006/api/documents/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVectors": 35,
    "dimension": 1536
  }
}
```

### 2. Test search

```bash
curl -X POST http://localhost:3006/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Làm sao deploy project?",
    "topK": 3
  }'
```

### 3. Test với RAG

```bash
curl -X POST http://localhost:3006/api/upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "userPrompt": "Hướng dẫn deploy My SaaS Chat",
    "userId": "user-123"
  }'
```

**Expected:** Response sẽ có documents về deployment guide!

---

## 🔄 Update Dữ Liệu

### Thêm documents mới:

1. Edit `data/MY_CUSTOM_DOCS.json`
2. Thêm documents mới vào array
3. Run `npm run seed:my-docs` lại

**Lưu ý:** Script sẽ **THÊM** documents, không xóa cũ!

### Xóa tất cả và upload lại:

```bash
# Xóa tất cả documents trong category "my-project"
curl -X DELETE http://localhost:3006/api/documents/filter \
  -H "Content-Type: application/json" \
  -d '{"filter": {"category": "my-project"}}'

# Rồi upload lại
npm run seed:my-docs
```

---

## 🎯 Workflow Recommended

### Lần đầu tiên:
```bash
# 1. Test với sample docs
npm run seed:docs

# 2. Test RAG
curl -X POST http://localhost:3006/api/upgrade \
  -d '{"userPrompt": "React optimization tips"}'

# 3. Nếu ok, thêm docs của bạn
notepad data\MY_CUSTOM_DOCS.json
npm run seed:my-docs
```

### Sau này khi cần update:
```bash
# Edit file
notepad data\MY_CUSTOM_DOCS.json

# Upload
npm run seed:my-docs
```

---

## 📁 File Structure

```
orchestrator-service/
├── data/
│   ├── sample-docs.json          ← 30 docs mẫu
│   └── MY_CUSTOM_DOCS.json       ← DỮ LIỆU CỦA BẠN Ở ĐÂY
│
├── scripts/
│   ├── seed-documents.ts         ← Upload sample-docs.json
│   └── seed-my-docs.ts           ← Upload MY_CUSTOM_DOCS.json
│
└── package.json
    └── scripts:
        ├── "seed:docs"           ← npm run seed:docs
        └── "seed:my-docs"        ← npm run seed:my-docs
```

---

## ❓ FAQ

### Q: Tôi có thể upload file PDF/Word không?

A: Không trực tiếp. Bạn cần:
1. Copy text từ PDF/Word
2. Paste vào `content` field trong JSON
3. Run seed script

### Q: Tối đa bao nhiêu documents?

A: Pinecone free tier: 100,000 vectors (rất nhiều!)
Mỗi document = 1 vector

### Q: Upload mất bao lâu?

A: ~0.1s/document (10 docs ≈ 1 giây)

### Q: Cost bao nhiêu?

A: OpenAI embeddings: ~$0.0001/document (rất rẻ!)
30 documents ≈ $0.003 USD

### Q: Có thể upload bằng UI không?

A: Hiện tại chỉ có API. Có thể tạo web UI sau!

---

## 🎉 Tóm Tắt

**Để thêm dữ liệu của bạn:**

1. **Mở file:** `notepad data\MY_CUSTOM_DOCS.json`
2. **Edit:** Thêm documents theo format JSON
3. **Upload:** `npm run seed:my-docs`
4. **Test:** Query qua API để check

**Xong!** Pinecone giờ có kiến thức của bạn và RAG sẽ dùng để enhance prompts! 🚀
