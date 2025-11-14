# BƯỚC 2: EMBEDDING - CHUYỂN TEXT THÀNH "MÃ SỐ THẦN KỲ"

## 🎯 Mục tiêu
Chuyển mỗi tài liệu thành một dãy số đặc biệt để máy tính có thể "hiểu" và so sánh

---

## 🤔 EMBEDDING LÀ GÌ? (Giải thích bằng ví dụ)

### So sánh với thực tế:

Hãy tưởng tượng em có **3 cuốn sách**:

1. 📘 **Sách A:** "Cách nấu phở"
2. 📗 **Sách B:** "Cách nấu bún bò"
3. 📙 **Sách C:** "Cách sửa xe máy"

**Câu hỏi:** Sách nào giống sách nào nhất?

👤 **Con người:** "A và B giống nhau (cùng về nấu ăn), C khác (về sửa xe)"

🤖 **Máy tính:** "??? Chỉ thấy chữ, không hiểu nghĩa!"

---

### 💡 GIẢI PHÁP: EMBEDDING (Mã hóa nghĩa)

**Embedding** = Chuyển text thành **toạ độ trong không gian**

```
Text: "Cách nấu phở"
  ↓ (AI xử lý)
Embedding: [0.2, 0.8, 0.1, 0.3, ..., 0.5]
           └── 1536 số (như toạ độ 1536 chiều!)
```

**Tại sao dùng số?**
- Máy tính tính toán số rất nhanh
- Có thể đo "khoảng cách" giữa 2 văn bản
- Văn bản giống nhau = Toạ độ gần nhau

---

## 🎨 HÌNH ẢNH HÓA (Simplified)

### Không gian 2D (cho dễ hiểu):

```
      Nấu ăn
        ↑
        │
   A •  │  • B   (A và B gần nhau)
        │
────────┼────────→ Sửa chữa
        │
        │
        │  • C    (C xa A, B)
```

**Giải thích:**
- **A** (phở) và **B** (bún bò): Gần nhau vì cùng về "nấu ăn"
- **C** (sửa xe): Xa vì khác chủ đề

**Thực tế:** Không gian có 1536 chiều (không tưởng tượng được), nhưng nguyên lý giống vậy!

---

## 💻 CODE: Tạo Embedding

### File: `services/embedding.service.ts`

```typescript
import OpenAI from 'openai';

class EmbeddingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Chuyển text thành embedding (mảng 1536 số)
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`📝 Đang tạo embedding cho: "${text.substring(0, 50)}..."`);

      // Gọi OpenAI API
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Model embedding
        input: text,
        encoding_format: 'float' // Trả về số thực
      });

      // Lấy embedding (mảng 1536 số)
      const embedding = response.data[0].embedding;

      console.log(`✅ Đã tạo embedding: ${embedding.length} chiều`);
      // embedding.length = 1536

      return embedding;

    } catch (error) {
      console.error('❌ Lỗi tạo embedding:', error);
      throw error;
    }
  }

  /**
   * Tính độ tương đồng giữa 2 embeddings (0-1)
   * 1 = Giống hệt, 0 = Hoàn toàn khác
   */
  cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    // Công thức toán học: cosine similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embeddingA.length; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      normA += embeddingA[i] * embeddingA[i];
      normB += embeddingB[i] * embeddingB[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

    return similarity;
  }
}

export const embeddingService = new EmbeddingService();
```

---

## 🧪 VÍ DỤ SỬ DỤNG

```typescript
// Test embedding
async function testEmbedding() {
  const textA = "Cách nấu phở bò truyền thống";
  const textB = "Hướng dẫn nấu bún bò Huế";
  const textC = "Cách sửa chữa động cơ xe máy";

  // Tạo embeddings
  const embA = await embeddingService.createEmbedding(textA);
  const embB = await embeddingService.createEmbedding(textB);
  const embC = await embeddingService.createEmbedding(textC);

  // Tính độ giống nhau
  const simAB = embeddingService.cosineSimilarity(embA, embB);
  const simAC = embeddingService.cosineSimilarity(embA, embC);

  console.log(`Phở vs Bún bò: ${(simAB * 100).toFixed(1)}% giống nhau`);
  // Output: "Phở vs Bún bò: 85.3% giống nhau"

  console.log(`Phở vs Sửa xe: ${(simAC * 100).toFixed(1)}% giống nhau`);
  // Output: "Phở vs Sửa xe: 12.7% giống nhau"
}

testEmbedding();
```

**Kết quả:**
```
✅ Đã tạo embedding: 1536 chiều
✅ Đã tạo embedding: 1536 chiều
✅ Đã tạo embedding: 1536 chiều

Phở vs Bún bò: 85.3% giống nhau ← Cao!
Phở vs Sửa xe: 12.7% giống nhau ← Thấp!
```

---

## 📊 EMBED TẤT CẢ TÀI LIỆU

### Script: Tạo embedding cho toàn bộ Knowledge Base

```typescript
// File: scripts/embed-knowledge-base.ts

import { prisma } from '../config/database.config';
import { embeddingService } from '../services/embedding.service';

async function embedAllDocuments() {
  console.log('🚀 Bắt đầu embedding tất cả tài liệu...\n');

  // Lấy tất cả documents từ database
  const documents = await prisma.knowledgeDocument.findMany();

  console.log(`📚 Tìm thấy ${documents.length} tài liệu\n`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    console.log(`[${i + 1}/${documents.length}] Đang xử lý: ${doc.title}`);

    // Kết hợp title + content để embed
    const textToEmbed = `${doc.title}\n\n${doc.content}`;

    // Tạo embedding
    const embedding = await embeddingService.createEmbedding(textToEmbed);

    // Lưu embedding vào database
    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: {
        embedding: embedding, // Lưu mảng số
        embeddedAt: new Date()
      }
    });

    console.log(`✅ Đã lưu embedding (${embedding.length} dimensions)\n`);
  }

  console.log('🎉 HOÀN THÀNH! Tất cả documents đã có embedding');
}

// Chạy
embedAllDocuments();
```

---

## 🗄️ CẬP NHẬT DATABASE SCHEMA

### Thêm cột `embedding` vào bảng:

```prisma
// File: prisma/schema.prisma

model KnowledgeDocument {
  id          String   @id @default(uuid())
  title       String
  content     String   @db.Text
  category    String
  tags        String[]
  examples    Json?

  // ← THÊM PHẦN NÀY
  embedding   Float[]  // Mảng số thực (1536 số)
  embeddedAt  DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([tags])
}
```

### Chạy migration:
```bash
npx prisma migrate dev --name add_embedding_column
npx prisma generate
```

---

## 🎯 TẠI SAO CẦN EMBEDDING?

### Kịch bản thực tế:

**User hỏi:** "Làm sao để AI suy nghĩ từng bước?"

**Hệ thống cần tìm tài liệu liên quan:**

```typescript
// 1. Tạo embedding cho câu hỏi
const questionEmb = await embeddingService.createEmbedding(
  "Làm sao để AI suy nghĩ từng bước?"
);

// 2. Lấy tất cả documents có embedding
const allDocs = await prisma.knowledgeDocument.findMany({
  where: { embedding: { not: null } }
});

// 3. Tính similarity với từng document
const results = allDocs.map(doc => {
  const similarity = embeddingService.cosineSimilarity(
    questionEmb,
    doc.embedding
  );

  return {
    document: doc,
    similarity: similarity
  };
});

// 4. Sắp xếp theo độ giống (cao → thấp)
results.sort((a, b) => b.similarity - a.similarity);

// 5. Lấy top 3 documents giống nhất
const topDocs = results.slice(0, 3);

console.log('📚 Tài liệu liên quan:');
topDocs.forEach((result, index) => {
  console.log(`${index + 1}. ${result.document.title} (${(result.similarity * 100).toFixed(1)}%)`);
});
```

**Kết quả:**
```
📚 Tài liệu liên quan:
1. Chain-of-Thought Prompting (92.5%) ← Chính xác!
2. Step-by-step Reasoning (87.3%)
3. ReAct Framework (81.2%)
```

---

## ✅ KẾT QUẢ SAU BƯỚC 2

```
📚 Knowledge Base (Updated)
├── 100-200 tài liệu
├── Mỗi tài liệu có embedding (1536 số)
├── Có thể tính độ giống nhau
└── Sẵn sàng cho tìm kiếm thông minh!
```

---

## 💡 TIPS

1. **Cache embeddings:** Tạo 1 lần, dùng mãi (tiết kiệm tiền)
2. **Batch processing:** Embed nhiều docs cùng lúc (nhanh hơn)
3. **Monitor costs:** OpenAI tính phí theo số tokens
   - text-embedding-3-small: Rẻ, đủ dùng
   - text-embedding-3-large: Đắt hơn, chính xác hơn

---

## 🧪 CHẠY THỬ

```bash
# Tạo script
touch scripts/embed-knowledge-base.ts

# Paste code vào

# Chạy
npx tsx scripts/embed-knowledge-base.ts

# Kết quả:
# 🚀 Bắt đầu embedding tất cả tài liệu...
# 📚 Tìm thấy 150 tài liệu
# [1/150] Đang xử lý: ROLE/TASK/CONTEXT Pattern
# ✅ Đã lưu embedding (1536 dimensions)
# ...
# 🎉 HOÀN THÀNH! Tất cả documents đã có embedding
```

---

## 🔍 KHÁI NIỆM QUAN TRỌNG

| Thuật ngữ | Giải thích đơn giản | Ví dụ |
|-----------|---------------------|-------|
| **Embedding** | Chuyển text → mảng số | "Xin chào" → [0.1, 0.5, ..., 0.3] |
| **Dimension** | Độ dài mảng số | 1536 chiều = 1536 số |
| **Cosine Similarity** | Đo độ giống (0-1) | 0.9 = Rất giống, 0.1 = Khác xa |
| **Vector** | Mảng số (toạ độ) | [0.2, 0.8, 0.1] |

---

**NEXT:** Bước 3 - Vector Store (Lưu trữ thông minh để tìm kiếm nhanh)
