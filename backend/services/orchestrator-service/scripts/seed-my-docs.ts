import * as fs from 'fs';
import * as path from 'path';
import { embeddingService } from '../src/services/embedding.service';
import { vectorStoreService } from '../src/services/vector-store.service';
import logger from '../src/config/logger.config';
import { initPinecone } from '../src/config/pinecone.config';
import { connectDatabase } from '../src/config/database.config';
import { VectorDocument } from '../src/types/vector.types';

interface CustomDocument {
  content: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  language: string;
  userId?: string;
}

/**
 * Seed YOUR custom documents into Pinecone
 * Edit data/MY_CUSTOM_DOCS.json to add your documents
 */
async function seedMyDocuments() {
  console.log('\n🌱 Uploading YOUR custom documents to Pinecone...\n');

  try {
    // Initialize connections
    console.log('📡 Connecting to database and Pinecone...');
    await connectDatabase();
    await initPinecone();
    console.log('✅ Connected!\n');

    // Load YOUR custom documents
    const dataPath = path.join(__dirname, '../data/MY_CUSTOM_DOCS.json');

    if (!fs.existsSync(dataPath)) {
      console.error('❌ File not found: data/MY_CUSTOM_DOCS.json');
      console.log('\n📝 Please create the file first:');
      console.log('   notepad data\\MY_CUSTOM_DOCS.json');
      console.log('\n   Or use the template that was created for you!\n');
      process.exit(1);
    }

    const documentsData = fs.readFileSync(dataPath, 'utf-8');
    const documents: CustomDocument[] = JSON.parse(documentsData);

    if (documents.length === 0) {
      console.log('⚠️  File is empty! Please add some documents first.\n');
      process.exit(0);
    }

    console.log(`📚 Loaded ${documents.length} custom documents from MY_CUSTOM_DOCS.json\n`);

    // Show what documents are being uploaded
    console.log('📋 Documents to upload:');
    documents.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.title} (${doc.category})`);
    });
    console.log('');

    // Check current index stats
    const stats = await vectorStoreService.getStats();
    console.log(`📊 Current Pinecone stats:`);
    console.log(`   - Total vectors: ${stats.totalVectors}`);
    console.log(`   - Dimension: ${stats.dimension}\n`);

    // Generate embeddings
    console.log('🔮 Generating embeddings with OpenAI...');
    const texts = documents.map((doc) => doc.content);

    const BATCH_SIZE = 20;
    const vectorDocuments: VectorDocument[] = [];

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const batchTexts = batch.map((doc) => doc.content);

      console.log(`   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(documents.length / BATCH_SIZE)}...`);

      const startTime = Date.now();
      const embeddingResult = await embeddingService.embedBatch(batchTexts, {
        useCache: false,
      });
      const duration = Date.now() - startTime;

      console.log(`   ✓ Generated ${embeddingResult.embeddings.length} embeddings in ${duration}ms`);
      console.log(`   ✓ Tokens used: ${embeddingResult.totalTokens}`);

      // Create vector documents
      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j];
        const embedding = embeddingResult.embeddings[j].embedding;

        vectorDocuments.push({
          id: `custom-doc-${Date.now()}-${i + j}`,
          embedding,
          metadata: {
            content: doc.content,
            title: doc.title,
            category: doc.category,
            tags: doc.tags,
            source: doc.source,
            language: doc.language,
            createdAt: new Date().toISOString(),
            userId: doc.userId || null,
          },
        });
      }
    }

    console.log(`\n✅ Generated ${vectorDocuments.length} vector documents\n`);

    // Upload to Pinecone
    console.log('📤 Uploading to Pinecone...');
    const UPSERT_BATCH_SIZE = 100;

    for (let i = 0; i < vectorDocuments.length; i += UPSERT_BATCH_SIZE) {
      const batch = vectorDocuments.slice(i, i + UPSERT_BATCH_SIZE);

      console.log(`   Batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}/${Math.ceil(vectorDocuments.length / UPSERT_BATCH_SIZE)}...`);

      const startTime = Date.now();
      const result = await vectorStoreService.upsert(batch);
      const duration = Date.now() - startTime;

      console.log(`   ✓ Uploaded ${result.upsertedCount} vectors in ${duration}ms`);
    }

    console.log('\n✅ Upload complete!\n');

    // Verify
    const finalStats = await vectorStoreService.getStats();
    console.log('🔍 Final stats:');
    console.log(`   - Total vectors: ${finalStats.totalVectors}`);
    console.log(`   - Newly added: ${finalStats.totalVectors - stats.totalVectors}`);

    // Test retrieval with first document
    console.log('\n🧪 Testing retrieval with your first document...');
    const testQuery = documents[0].title;
    console.log(`   Query: "${testQuery}"`);

    const embeddingResult = await embeddingService.embed(testQuery);
    const results = await vectorStoreService.query(embeddingResult.embedding, {
      topK: 3,
    });

    if (results.length === 0) {
      console.log('   ⚠️  No results found (this might be normal if documents are very different)');
    } else {
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. [Score: ${(result.score * 100).toFixed(1)}%] ${result.metadata.title}`);
      });
    }

    console.log('\n\n🎉 YOUR custom documents are now in Pinecone!');
    console.log('\n📝 Summary:');
    console.log(`   - Documents uploaded: ${documents.length}`);
    console.log(`   - Total in Pinecone: ${finalStats.totalVectors}`);
    console.log('\n✅ Ready to use for RAG!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

// Run
seedMyDocuments();
