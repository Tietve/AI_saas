import * as fs from 'fs';
import * as path from 'path';
import { embeddingService } from '../src/services/embedding.service';
import { vectorStoreService } from '../src/services/vector-store.service';
import logger from '../src/config/logger.config';
import { initPinecone } from '../src/config/pinecone.config';
import { connectDatabase } from '../src/config/database.config';
import { VectorDocument } from '../src/types/vector.types';

interface SampleDocument {
  content: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  language: string;
  userId?: string;
}

/**
 * Seed documents into Pinecone
 */
async function seedDocuments() {
  console.log('\n🌱 Starting Pinecone document seeding...\n');

  try {
    // Initialize connections
    console.log('📡 Initializing connections...');
    await connectDatabase();
    await initPinecone();
    console.log('✅ Connections initialized\n');

    // Load sample documents
    const dataPath = path.join(__dirname, '../data/sample-docs.json');
    const documentsData = fs.readFileSync(dataPath, 'utf-8');
    const documents: SampleDocument[] = JSON.parse(documentsData);

    console.log(`📚 Loaded ${documents.length} documents from ${dataPath}\n`);

    // Check if index already has data
    const stats = await vectorStoreService.getStats();
    console.log(`📊 Current index stats:`);
    console.log(`   - Total vectors: ${stats.totalVectors}`);
    console.log(`   - Dimension: ${stats.dimension}`);
    console.log(`   - Index fullness: ${(stats.indexFullness * 100).toFixed(2)}%\n`);

    if (stats.totalVectors > 0) {
      console.log('⚠️  Index already contains documents.');
      console.log('   This will ADD new documents (not replace existing ones).');
      console.log('   To start fresh, delete the index in Pinecone dashboard first.\n');

      // Ask for confirmation (skip in automated environments)
      if (process.env.SKIP_CONFIRMATION !== 'true') {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question('   Continue? (yes/no): ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
          console.log('\n❌ Seeding cancelled by user.\n');
          process.exit(0);
        }
        console.log('');
      }
    }

    // Generate embeddings in batches
    console.log('🔮 Generating embeddings...');
    const BATCH_SIZE = 20; // OpenAI allows up to 2048 inputs per request
    const vectorDocuments: VectorDocument[] = [];

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const texts = batch.map((doc) => doc.content);

      console.log(`   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(documents.length / BATCH_SIZE)} (${batch.length} documents)...`);

      const startTime = Date.now();
      const embeddingResult = await embeddingService.embedBatch(texts, {
        useCache: false, // Don't use cache for seeding
      });
      const duration = Date.now() - startTime;

      console.log(`   ✓ Generated ${embeddingResult.embeddings.length} embeddings in ${duration}ms`);
      console.log(`   ✓ Total tokens: ${embeddingResult.totalTokens}`);

      // Create vector documents
      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j];
        const embedding = embeddingResult.embeddings[j].embedding;

        vectorDocuments.push({
          id: `doc-${Date.now()}-${i + j}`, // Unique ID
          embedding,
          metadata: {
            content: doc.content, // Required by RAG agent
            title: doc.title,
            category: doc.category,
            tags: doc.tags,
            source: doc.source,
            language: doc.language,
            createdAt: new Date().toISOString(),
            // Optional: add userId for multi-tenant RAG
            // userId: doc.userId || null,
          },
        });
      }
    }

    console.log(`\n✅ Generated ${vectorDocuments.length} vector documents\n`);

    // Upsert to Pinecone in batches
    console.log('📤 Uploading to Pinecone...');
    const UPSERT_BATCH_SIZE = 100; // Pinecone limit

    for (let i = 0; i < vectorDocuments.length; i += UPSERT_BATCH_SIZE) {
      const batch = vectorDocuments.slice(i, i + UPSERT_BATCH_SIZE);

      console.log(`   Uploading batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}/${Math.ceil(vectorDocuments.length / UPSERT_BATCH_SIZE)} (${batch.length} vectors)...`);

      const startTime = Date.now();
      const result = await vectorStoreService.upsert(batch);
      const duration = Date.now() - startTime;

      console.log(`   ✓ Upserted ${result.upsertedCount} vectors in ${duration}ms`);
    }

    console.log('\n✅ Upload complete!\n');

    // Verify upload
    console.log('🔍 Verifying upload...');
    const finalStats = await vectorStoreService.getStats();
    console.log(`   - Total vectors: ${finalStats.totalVectors}`);
    console.log(`   - Newly added: ${finalStats.totalVectors - stats.totalVectors}`);

    // Test retrieval
    console.log('\n🧪 Testing retrieval...');
    const testQueries = [
      'How to optimize React performance?',
      'Database indexing best practices',
      'API security recommendations',
    ];

    for (const query of testQueries) {
      console.log(`\n   Query: "${query}"`);
      const embeddingResult = await embeddingService.embed(query);
      const results = await vectorStoreService.query(embeddingResult.embedding, {
        topK: 3,
      });

      if (results.length === 0) {
        console.log('   ⚠️  No results found');
      } else {
        results.forEach((result, index) => {
          console.log(`   ${index + 1}. [Score: ${(result.score * 100).toFixed(1)}%] ${result.metadata.title}`);
        });
      }
    }

    console.log('\n\n🎉 Seeding completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Documents loaded: ${documents.length}`);
    console.log(`   - Vectors created: ${vectorDocuments.length}`);
    console.log(`   - Total in index: ${finalStats.totalVectors}`);
    console.log('\n✅ Your Pinecone index is now populated and ready for RAG!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.stack) {
        console.error('\n   Stack trace:');
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

// Run seeding
seedDocuments();
