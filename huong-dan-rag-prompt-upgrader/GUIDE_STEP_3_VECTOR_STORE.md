# BƯỚC 3: VECTOR STORE - THƯ VIỆN THÔNG MINH

## 🎯 Mục tiêu
Lưu trữ embeddings và tìm kiếm tài liệu liên quan SIÊU NHANH (< 100ms)

---

## 🤔 VECTOR STORE LÀ GÌ?

### So sánh với thư viện thật:

| Thư viện thường | Vector Store (Thư viện thông minh) |
|-----------------|-------------------------------------|
| Sắp xếp theo ABC | Sắp xếp theo "nội dung giống nhau" |
| Tìm sách: "Quét mắt từng cuốn" | Tìm sách: "Máy tính tính toán" |
| Chậm (phút) | Nhanh (mili-giây) |
| Chỉ tìm theo tên | Tìm theo nghĩa |

---

## 🎨 HÌNH ẢNH HÓA

### Thư viện thường:
```
[A] [B] [C] [D] [E] ... [Z]
     ↑
Tìm sách "Bún bò" → Phải quét từ A đến B (lâu!)
```

### Vector Store:
```
        Nấu ăn
          ↑
     Phở• │ •Bún bò  ← Gần nhau!
          │
──────────┼──────────→ Sửa chữa
          │
          │ •Sửa xe
```

**Tìm "Bún bò":**
1. Chuyển thành toạ độ
2. Tìm toạ độ gần nhất
3. Kết quả: "Phở" (vì gần nhất!)
4. Tốc độ: < 100ms (siêu nhanh!)

---

## 💻 CÁCH CHỌN VECTOR STORE

### 3 lựa chọn phổ biến:

| Tool | Ưu điểm | Nhược điểm | Phù hợp với |
|------|---------|------------|-------------|
| **PostgreSQL + pgvector** | ✅ Đơn giản, không cần setup thêm | ⚠️ Chậm hơn (> 100ms với 10k+ docs) | Dự án nhỏ (< 10k docs) |
| **Pinecone** | ✅ Nhanh, dễ dùng, cloud | ❌ Tốn tiền ($70/tháng) | Dự án có tiền |
| **Qdrant** | ✅ Nhanh, mã nguồn mở, miễn phí | ⚠️ Phải setup Docker | Dự án vừa/lớn |

**Khuyến nghị cho em:**
- Bắt đầu: **pgvector** (đơn giản nhất)
- Sau này scale: **Qdrant** (miễn phí + nhanh)

---

## 📚 OPTION 1: PGVECTOR (ĐƠN GIẢN NHẤT)

### Bước 1: Cài đặt pgvector extension

```sql
-- Chạy trong PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;
```

### Bước 2: Cập nhật Prisma Schema

```prisma
// File: prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [vector]
}

model KnowledgeDocument {
  id          String   @id @default(uuid())
  title       String
  content     String   @db.Text
  category    String
  tags        String[]
  examples    Json?

  // Embedding as vector type
  embedding   Unsupported("vector(1536)")?
  embeddedAt  DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([tags])
}
```

### Bước 3: Code tìm kiếm

```typescript
// File: services/vector-store.service.ts

import { prisma } from '../config/database.config';
import { embeddingService } from './embedding.service';

class VectorStoreService {
  /**
   * Tìm tài liệu liên quan nhất
   */
  async searchSimilar(query: string, topK: number = 5) {
    console.log(`🔍 Tìm kiếm: "${query}"`);

    // 1. Tạo embedding cho query
    const queryEmbedding = await embeddingService.createEmbedding(query);

    // 2. Tìm kiếm bằng SQL (pgvector)
    const results = await prisma.$queryRaw`
      SELECT
        id,
        title,
        content,
        category,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "KnowledgeDocument"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${topK}
    `;

    console.log(`✅ Tìm thấy ${results.length} tài liệu liên quan`);

    return results;
  }

  /**
   * Lưu embedding vào database
   */
  async saveEmbedding(documentId: string, embedding: number[]) {
    await prisma.$executeRaw`
      UPDATE "KnowledgeDocument"
      SET embedding = ${embedding}::vector
      WHERE id = ${documentId}
    `;
  }
}

export const vectorStoreService = new VectorStoreService();
```

---

## 🧪 VÍ DỤ SỬ DỤNG

```typescript
// Test tìm kiếm
async function testVectorSearch() {
  const query = "Làm sao để AI suy nghĩ từng bước?";

  const results = await vectorStoreService.searchSimilar(query, 3);

  console.log('\n📊 KẾT QUẢ TÌM KIẾM:\n');

  results.forEach((doc, index) => {
    console.log(`${index + 1}. ${doc.title}`);
    console.log(`   Độ tương đồng: ${(doc.similarity * 100).toFixed(1)}%`);
    console.log(`   Nội dung: ${doc.content.substring(0, 100)}...`);
    console.log('');
  });
}

testVectorSearch();
```

**Kết quả:**
```
🔍 Tìm kiếm: "Làm sao để AI suy nghĩ từng bước?"
✅ Tìm thấy 3 tài liệu liên quan

📊 KẾT QUẢ TÌM KIẾM:

1. Chain-of-Thought Prompting
   Độ tương đồng: 92.5%
   Nội dung: Chain-of-Thought (CoT) là kỹ thuật dạy AI suy nghĩ từng bước...

2. Step-by-step Reasoning Techniques
   Độ tương đồng: 87.3%
   Nội dung: Để AI suy luận hiệu quả, cần chia nhỏ vấn đề thành các bước...

3. Few-shot Learning with Examples
   Độ tương đồng: 81.2%
   Nội dung: Khi cung cấp ví dụ, AI học cách làm theo từng bước...
```

---

## 🚀 OPTION 2: QDRANT (NÂNG CAO HỠN)

### Tại sao dùng Qdrant?
- ✅ Nhanh hơn pgvector 10-100 lần
- ✅ Miễn phí (self-hosted)
- ✅ Có filters, faceted search
- ✅ Dashboard đẹp

### Bước 1: Setup Qdrant với Docker

```yaml
# File: docker-compose.yml (thêm vào)

services:
  # ... các services khác

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"  # REST API
      - "6334:6334"  # gRPC
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334

volumes:
  qdrant_data:
```

### Bước 2: Khởi động

```bash
docker-compose up -d qdrant

# Kiểm tra
curl http://localhost:6333/collections
# Kết quả: {"result":{"collections":[]},"status":"ok","time":0.000123}
```

### Bước 3: Code sử dụng Qdrant

```typescript
// File: services/qdrant.service.ts

import { QdrantClient } from '@qdrant/js-client-rest';
import { embeddingService } from './embedding.service';

class QdrantService {
  private client: QdrantClient;
  private collectionName = 'knowledge_base';

  constructor() {
    this.client = new QdrantClient({
      url: 'http://localhost:6333'
    });
  }

  /**
   * Tạo collection (1 lần duy nhất)
   */
  async createCollection() {
    try {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: 1536,           // Kích thước embedding
          distance: 'Cosine'    // Thuật toán tính khoảng cách
        }
      });

      console.log('✅ Đã tạo collection');
    } catch (error) {
      console.log('⚠️ Collection đã tồn tại');
    }
  }

  /**
   * Lưu document vào Qdrant
   */
  async upsertDocument(doc: {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    embedding: number[];
  }) {
    await this.client.upsert(this.collectionName, {
      points: [
        {
          id: doc.id,
          vector: doc.embedding,
          payload: {
            title: doc.title,
            content: doc.content,
            category: doc.category,
            tags: doc.tags
          }
        }
      ]
    });

    console.log(`✅ Đã lưu: ${doc.title}`);
  }

  /**
   * Tìm kiếm tài liệu liên quan
   */
  async searchSimilar(query: string, topK: number = 5) {
    console.log(`🔍 Tìm kiếm: "${query}"`);

    // 1. Tạo embedding cho query
    const queryEmbedding = await embeddingService.createEmbedding(query);

    // 2. Tìm kiếm trong Qdrant
    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit: topK,
      with_payload: true
    });

    console.log(`✅ Tìm thấy ${results.length} tài liệu`);

    return results.map(result => ({
      id: result.id,
      title: result.payload.title,
      content: result.payload.content,
      category: result.payload.category,
      tags: result.payload.tags,
      similarity: result.score
    }));
  }

  /**
   * Tìm kiếm với filters (lọc theo category, tags)
   */
  async searchWithFilter(
    query: string,
    category?: string,
    tags?: string[]
  ) {
    const queryEmbedding = await embeddingService.createEmbedding(query);

    // Xây dựng filter
    const filter: any = { must: [] };

    if (category) {
      filter.must.push({
        key: 'category',
        match: { value: category }
      });
    }

    if (tags && tags.length > 0) {
      filter.must.push({
        key: 'tags',
        match: { any: tags }
      });
    }

    // Tìm kiếm
    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit: 5,
      filter: filter.must.length > 0 ? filter : undefined,
      with_payload: true
    });

    return results;
  }
}

export const qdrantService = new QdrantService();
```

---

## 🧪 MIGRATE DỮ LIỆU VÀO QDRANT

```typescript
// File: scripts/migrate-to-qdrant.ts

import { prisma } from '../config/database.config';
import { qdrantService } from '../services/qdrant.service';

async function migrateToQdrant() {
  console.log('🚀 Bắt đầu migrate dữ liệu vào Qdrant...\n');

  // 1. Tạo collection
  await qdrantService.createCollection();

  // 2. Lấy tất cả documents từ PostgreSQL
  const documents = await prisma.knowledgeDocument.findMany({
    where: {
      embedding: { not: null }
    }
  });

  console.log(`📚 Tìm thấy ${documents.length} tài liệu\n`);

  // 3. Upload vào Qdrant
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    await qdrantService.upsertDocument({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category,
      tags: doc.tags,
      embedding: doc.embedding
    });

    console.log(`[${i + 1}/${documents.length}] ✅ ${doc.title}`);
  }

  console.log('\n🎉 Hoàn thành migration!');
}

migrateToQdrant();
```

---

## 📊 SO SÁNH HIỆU NĂNG

| | pgvector | Qdrant |
|---|----------|--------|
| **Setup** | Rất dễ (PostgreSQL có sẵn) | Vừa (cần Docker) |
| **Tốc độ (1k docs)** | ~50-100ms | ~10-20ms |
| **Tốc độ (100k docs)** | ~500-1000ms | ~20-50ms |
| **Filters** | Có (SQL WHERE) | Có (mạnh hơn) |
| **Scalability** | Trung bình | Tốt |
| **Cost** | Miễn phí | Miễn phí (self-hosted) |

**Khuyến nghị:**
- < 10k documents: **pgvector** (đơn giản)
- > 10k documents: **Qdrant** (nhanh hơn nhiều)

---

## ✅ KẾT QUẢ SAU BƯỚC 3

```
🎯 Vector Store System
├── Lưu trữ 100-200 documents với embeddings
├── Tìm kiếm tài liệu liên quan < 100ms
├── Hỗ trợ filters (category, tags)
└── Sẵn sàng cho RAG Retriever!
```

---

## 💡 TIPS

1. **Index optimization:** Tạo index cho embedding column
   ```sql
   CREATE INDEX ON "KnowledgeDocument"
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);
   ```

2. **Cache results:** Cache kết quả tìm kiếm phổ biến (Redis)

3. **Batch upsert:** Upload nhiều docs cùng lúc (nhanh hơn)

4. **Monitor performance:** Đo thời gian tìm kiếm, optimize nếu > 200ms

---

## 🧪 CHẠY THỬ

```bash
# pgvector
npx prisma migrate dev
npx tsx scripts/test-vector-search.ts

# Qdrant
docker-compose up -d qdrant
npx tsx scripts/migrate-to-qdrant.ts
npx tsx scripts/test-qdrant-search.ts
```

---

**NEXT:** Bước 4 - Xây dựng Prompt Upgrader Agent (Kết nối tất cả lại!)
