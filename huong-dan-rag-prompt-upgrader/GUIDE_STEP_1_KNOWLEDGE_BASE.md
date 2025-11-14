# BƯỚC 1: TẠO KNOWLEDGE BASE - THƯ VIỆN TÀI LIỆU

## 🎯 Mục tiêu
Thu thập và lưu trữ tài liệu về prompt engineering (100-200 documents)

---

## 📚 CẤU TRÚC MỘT TÀI LIỆU

### Ví dụ dễ hiểu:

```json
{
  "id": "doc-001",
  "title": "Cách dùng Chain-of-Thought Prompting",
  "content": "Chain-of-Thought (CoT) là kỹ thuật dạy AI suy nghĩ từng bước...",
  "category": "fundamentals",
  "tags": ["reasoning", "step-by-step", "examples"],
  "examples": [
    {
      "before": "Tính 23 x 17",
      "after": "Hãy tính từng bước:\n1. 23 x 10 = 230\n2. 23 x 7 = 161\n3. 230 + 161 = 391"
    }
  ]
}
```

**Giải thích:**
- `id`: Mã số tài liệu (như mã sách trong thư viện)
- `title`: Tiêu đề
- `content`: Nội dung chi tiết (300-1000 chữ)
- `category`: Loại tài liệu (fundamental, advanced, etc.)
- `tags`: Nhãn dán để tìm kiếm
- `examples`: Ví dụ trước/sau

---

## 💻 CODE MẪU: Tạo tài liệu

### File: `scripts/create-knowledge-base.ts`

```typescript
// Định nghĩa cấu trúc tài liệu
interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  examples?: {
    before: string;
    after: string;
    explanation?: string;
  }[];
}

// Ví dụ tạo 1 tài liệu
const doc1: KnowledgeDocument = {
  id: 'prompt-eng-001',
  title: 'ROLE/TASK/CONTEXT Pattern',
  content: `
    Khi viết prompt cho AI, nên chia thành 3 phần:

    1. ROLE (Vai trò): "Bạn là một chuyên gia X"
    2. TASK (Nhiệm vụ): "Hãy làm việc Y"
    3. CONTEXT (Bối cảnh): "Với thông tin Z"

    Ví dụ:
    - ROLE: "Bạn là một giáo viên tiếng Anh"
    - TASK: "Giải thích từ 'serendipity'"
    - CONTEXT: "Cho học sinh lớp 8"

    Prompt tốt: "Bạn là một giáo viên tiếng Anh. Hãy giải thích
    từ 'serendipity' cho học sinh lớp 8 một cách đơn giản."
  `,
  category: 'fundamentals',
  tags: ['structure', 'role', 'task', 'context', 'basics'],
  examples: [
    {
      before: 'Giải thích từ này',
      after: 'Bạn là giáo viên. Hãy giải thích từ "serendipity" cho học sinh lớp 8.',
      explanation: 'Thêm ROLE (giáo viên) + CONTEXT (lớp 8) = rõ ràng hơn'
    }
  ]
};

// Hàm lưu tài liệu vào database
async function saveDocument(doc: KnowledgeDocument) {
  // Lưu vào PostgreSQL hoặc file JSON
  await prisma.knowledgeDocument.create({
    data: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category,
      tags: doc.tags,
      examples: JSON.stringify(doc.examples)
    }
  });

  console.log(`✅ Đã lưu: ${doc.title}`);
}

// Tạo nhiều tài liệu
async function createKnowledgeBase() {
  const documents: KnowledgeDocument[] = [
    doc1,
    // ... thêm 100-200 documents nữa
  ];

  for (const doc of documents) {
    await saveDocument(doc);
  }

  console.log(`✅ Hoàn thành! Đã tạo ${documents.length} tài liệu`);
}

// Chạy script
createKnowledgeBase();
```

---

## 📝 CÁCH THU THẬP TÀI LIỆU

### Cách 1: Thủ công (Slow nhưng chất lượng cao)
```typescript
// Đọc từ OpenAI docs, tự viết tóm tắt
const doc2: KnowledgeDocument = {
  id: 'prompt-eng-002',
  title: 'Few-shot Learning',
  content: `Khi dạy AI bằng ví dụ:
    - 1 ví dụ = One-shot
    - 2-5 ví dụ = Few-shot
    - Nhiều ví dụ = Many-shot

    Few-shot tốt nhất cho hầu hết trường hợp.
  `,
  category: 'techniques',
  tags: ['few-shot', 'examples', 'learning']
};
```

### Cách 2: Dùng AI để tạo (Fast!)
```typescript
async function generateDocumentWithAI(topic: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: 'Bạn là chuyên gia prompt engineering. Tạo tài liệu chi tiết.'
    }, {
      role: 'user',
      content: `Viết tài liệu về: ${topic}

      Bao gồm:
      - Định nghĩa (200-300 chữ)
      - Ví dụ trước/sau
      - Best practices
      - Lưu ý

      Trả về JSON format.`
    }],
    response_format: { type: 'json_object' }
  });

  const doc = JSON.parse(response.choices[0].message.content);
  return doc;
}

// Tạo 100 tài liệu tự động
const topics = [
  'Chain-of-Thought Prompting',
  'Few-shot Learning',
  'Role Assignment',
  'Output Format Control',
  // ... 96 topics nữa
];

for (const topic of topics) {
  const doc = await generateDocumentWithAI(topic);
  await saveDocument(doc);
}
```

---

## 📊 SCHEMA DATABASE (Cấu trúc bảng)

### Prisma Schema:

```prisma
// File: prisma/schema.prisma

model KnowledgeDocument {
  id          String   @id @default(uuid())
  title       String
  content     String   @db.Text // Cho phép text dài
  category    String
  tags        String[] // Mảng tags
  examples    Json?    // JSON object

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([tags])
}
```

### Chạy migration:
```bash
npx prisma migrate dev --name add_knowledge_documents
npx prisma generate
```

---

## ✅ KẾT QUẢ SAU BƯỚC 1

Sau khi hoàn thành, em sẽ có:

```
📚 Knowledge Base
├── 100-200 tài liệu về prompt engineering
├── Mỗi tài liệu có: title, content, examples, tags
├── Được lưu trong PostgreSQL
└── Sẵn sàng cho bước tiếp theo!
```

---

## 🚀 CHẠY THỬ

```bash
# Tạo file script
cd backend/services/orchestrator-service
mkdir -p scripts
touch scripts/create-knowledge-base.ts

# Paste code vào file

# Chạy script
npx tsx scripts/create-knowledge-base.ts

# Kết quả:
# ✅ Đã lưu: ROLE/TASK/CONTEXT Pattern
# ✅ Đã lưu: Few-shot Learning
# ✅ Đã lưu: Chain-of-Thought Prompting
# ...
# ✅ Hoàn thành! Đã tạo 150 tài liệu
```

---

## 💡 TIPS

1. **Bắt đầu nhỏ:** Tạo 10-20 docs trước, test xem có hoạt động không
2. **Chất lượng > Số lượng:** 50 docs tốt > 200 docs tệ
3. **Dùng AI giúp:** GPT-4 có thể tạo docs rất tốt nếu em viết prompt đúng
4. **Version control:** Commit vào Git để không mất dữ liệu

---

**NEXT:** Bước 2 - Embedding (Chuyển text thành số để tìm kiếm)
