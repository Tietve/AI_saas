import * as fs from 'fs';
import * as path from 'path';
import { embeddingService } from '../src/services/embedding.service';
import { vectorStoreService } from '../src/services/vector-store.service';
import logger from '../src/config/logger.config';
import { initPinecone } from '../src/config/pinecone.config';
import { connectDatabase } from '../src/config/database.config';
import { VectorDocument } from '../src/types/vector.types';

interface RAGDocument {
  content: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  language: string;
}

/**
 * Seed RAG Knowledge Base (parsed from RAG.md) into Pinecone
 */
async function seedRAGKnowledge() {
  console.log('\n🌱 Uploading RAG Knowledge Base to Pinecone...\n');
  console.log('='repeat(60));
  console.log('');

  try {
    // Initialize connections
    console.log('📡 Connecting to database and Pinecone...');
    await connectDatabase();
    await initPinecone();
    console.log('✅ Connected!\n');

    // Load parsed documents
    const dataPath = path.join(__dirname, '../data/RAG_KNOWLEDGE_BASE.json');

    if (!fs.existsSync(dataPath)) {
      console.error('❌ RAG_KNOWLEDGE_BASE.json not found!');
      console.log('\n📝 Please run the parser first:');
      console.log('   npx tsx scripts/parse-rag-md.ts');
      console.log('\n   This will convert RAG.md into chunks.\n');
      process.exit(1);
    }

    const documentsData = fs.readFileSync(dataPath, 'utf-8');
    const documents: RAGDocument[] = JSON.parse(documentsData);

    if (documents.length === 0) {
      console.log('⚠️  File is empty! Please run parser first.\n');
      process.exit(0);
    }

    console.log(`📚 Loaded ${documents.length} knowledge chunks\n`);

    // Show summary by category
    const categoryStats = new Map<string, number>();
    documents.forEach(doc => {
      const count = categoryStats.get(doc.category) || 0;
      categoryStats.set(doc.category, count + 1);
    });

    console.log('📊 Knowledge Base Distribution:');
    for (const [category, count] of categoryStats.entries()) {
      console.log(`   - ${category}: ${count} chunks`);
    }
    console.log('');

    // Check current index stats
    const stats = await vectorStoreService.getStats();
    console.log(`📊 Current Pinecone Index:`);
    console.log(`   - Total vectors: ${stats.totalVectors}`);
    console.log(`   - Dimension: ${stats.dimension}`);

    if (stats.totalVectors > 0) {
      console.log('\n⚠️  Index already has data.');
      console.log('   This will ADD knowledge (not replace).');
      console.log('   To start fresh, delete index in Pinecone dashboard.\n');
    } else {
      console.log('   - Status: Empty (perfect for first upload)\n');
    }

    // Generate embeddings
    console.log('🔮 Generating embeddings with OpenAI...');
    console.log(`   Model: text-embedding-3-small\n`);

    const texts = documents.map((doc) => doc.content);

    const BATCH_SIZE = 20; // OpenAI batch limit
    const vectorDocuments: VectorDocument[] = [];

    let totalTokens = 0;
    let totalTime = 0;

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const batchTexts = batch.map((doc) => doc.content);

      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(documents.length / BATCH_SIZE);

      console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

      const startTime = Date.now();
      const embeddingResult = await embeddingService.embedBatch(batchTexts, {
        useCache: false,
      });
      const duration = Date.now() - startTime;

      totalTokens += embeddingResult.totalTokens;
      totalTime += duration;

      console.log(`   ✓ ${embeddingResult.embeddings.length} embeddings in ${duration}ms`);
      console.log(`   ✓ Tokens: ${embeddingResult.totalTokens}`);

      // Create vector documents
      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j];
        const embedding = embeddingResult.embeddings[j].embedding;

        vectorDocuments.push({
          id: `rag-kb-${Date.now()}-${i + j}`,
          embedding,
          metadata: {
            content: doc.content,
            title: doc.title,
            category: doc.category,
            tags: doc.tags,
            source: doc.source,
            language: doc.language,
            createdAt: new Date().toISOString(),
            // No userId - this is global knowledge base
            userId: null,
          },
        });
      }
    }

    console.log(`\n✅ Generated ${vectorDocuments.length} embeddings`);
    console.log(`   Total tokens: ${totalTokens}`);
    console.log(`   Total time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`   Avg per batch: ${(totalTime / Math.ceil(documents.length / BATCH_SIZE)).toFixed(0)}ms\n`);

    // Upload to Pinecone
    console.log('📤 Uploading to Pinecone...');
    const UPSERT_BATCH_SIZE = 100;

    let uploadTime = 0;

    for (let i = 0; i < vectorDocuments.length; i += UPSERT_BATCH_SIZE) {
      const batch = vectorDocuments.slice(i, i + UPSERT_BATCH_SIZE);

      const batchNum = Math.floor(i / UPSERT_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(vectorDocuments.length / UPSERT_BATCH_SIZE);

      console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} vectors)...`);

      const startTime = Date.now();
      const result = await vectorStoreService.upsert(batch);
      const duration = Date.now() - startTime;

      uploadTime += duration;

      console.log(`   ✓ Uploaded ${result.upsertedCount} vectors in ${duration}ms`);
    }

    console.log(`\n✅ Upload complete in ${(uploadTime / 1000).toFixed(1)}s\n`);

    // Verify
    const finalStats = await vectorStoreService.getStats();
    console.log('🔍 Final Verification:');
    console.log(`   - Total vectors: ${finalStats.totalVectors}`);
    console.log(`   - Newly added: ${finalStats.totalVectors - stats.totalVectors}`);

    // Test retrieval with various queries
    console.log('\n🧪 Testing Retrieval Quality...');

    const testQueries = [
      'How to write effective prompts?',
      'Chain-of-thought prompting techniques',
      'Multi-turn conversation context management',
      'JSON schema output format',
      'Common anti-patterns to avoid',
    ];

    for (const query of testQueries) {
      console.log(`\n   Query: "${query}"`);

      const embeddingResult = await embeddingService.embed(query);
      const results = await vectorStoreService.query(embeddingResult.embedding, {
        topK: 3,
      });

      if (results.length === 0) {
        console.log('   ⚠️  No results (unexpected!)');
      } else {
        results.forEach((result, index) => {
          const score = (result.score * 100).toFixed(1);
          const title = result.metadata.title;
          const category = result.metadata.category;
          console.log(`   ${index + 1}. [${score}%] ${title}`);
          console.log(`      Category: ${category}`);
        });
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('\n🎉 RAG Knowledge Base Successfully Uploaded!');
    console.log('\n📝 Summary:');
    console.log(`   - Chunks uploaded: ${documents.length}`);
    console.log(`   - Total in Pinecone: ${finalStats.totalVectors}`);
    console.log(`   - Total tokens used: ${totalTokens}`);
    console.log(`   - Avg embedding time: ${(totalTime / documents.length).toFixed(0)}ms per chunk`);
    console.log('\n📚 Knowledge Base Coverage:');
    for (const [category, count] of categoryStats.entries()) {
      console.log(`   - ${category}: ${count} chunks`);
    }
    console.log('\n✅ Ready for Multi-Turn RAG!');
    console.log('\n📝 Next Step:');
    console.log('   Test the system:');
    console.log('   npx tsx src/scripts/test-multi-turn-rag.ts\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.stack) {
        console.error('\n   Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

// Run
seedRAGKnowledge();
