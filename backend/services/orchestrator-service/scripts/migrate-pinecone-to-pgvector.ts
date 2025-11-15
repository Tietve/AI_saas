/**
 * Pinecone to pgvector Migration Script
 *
 * Migrates all vector data from Pinecone to pgvector (PostgreSQL)
 * Cost savings: $70/mo -> $0
 *
 * Usage:
 *   npm run build && node dist/scripts/migrate-pinecone-to-pgvector.js
 */

import { PrismaClient } from '@prisma/client';
import { getPineconeIndex } from '../src/config/pinecone.config';
import { VectorStoreService } from '../src/services/vector-store.service.new';
import logger from '../src/config/logger.config';

const prisma = new PrismaClient();
const vectorStore = new VectorStoreService(prisma);

interface MigrationStats {
  totalVectors: number;
  knowledgeVectors: number;
  documentVectors: number;
  conversationVectors: number;
  migratedVectors: number;
  failedVectors: number;
  duration: number;
}

async function migratePineconeToPgvector(): Promise<MigrationStats> {
  const startTime = Date.now();
  const stats: MigrationStats = {
    totalVectors: 0,
    knowledgeVectors: 0,
    documentVectors: 0,
    conversationVectors: 0,
    migratedVectors: 0,
    failedVectors: 0,
    duration: 0,
  };

  try {
    logger.info('='.repeat(60));
    logger.info('Starting Pinecone to pgvector migration...');
    logger.info('='.repeat(60));

    // Step 1: Get Pinecone index
    const pineconeIndex = await getPineconeIndex();

    // Step 2: Get index statistics
    const indexStats = await pineconeIndex.describeIndexStats();
    stats.totalVectors = indexStats.totalRecordCount || 0;

    logger.info(`Total vectors in Pinecone: ${stats.totalVectors}`);

    if (stats.totalVectors === 0) {
      logger.warn('No vectors found in Pinecone. Nothing to migrate.');
      stats.duration = Date.now() - startTime;
      return stats;
    }

    // Step 3: Fetch all vectors from Pinecone
    // Since Pinecone doesn't have a "list all" API, we need to query with metadata filters
    logger.info('Fetching vectors from Pinecone...');

    // Migrate KnowledgeBase vectors
    await migrateKnowledgeVectors(pineconeIndex, stats);

    // Migrate Document vectors
    await migrateDocumentVectors(pineconeIndex, stats);

    // Migrate ConversationSummary vectors
    await migrateConversationVectors(pineconeIndex, stats);

    stats.duration = Date.now() - startTime;

    logger.info('='.repeat(60));
    logger.info('Migration completed!');
    logger.info(`Total vectors migrated: ${stats.migratedVectors}`);
    logger.info(`Failed vectors: ${stats.failedVectors}`);
    logger.info(`Duration: ${(stats.duration / 1000).toFixed(2)}s`);
    logger.info('='.repeat(60));

    return stats;
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await vectorStore.disconnect();
  }
}

async function migrateKnowledgeVectors(pineconeIndex: any, stats: MigrationStats): Promise<void> {
  try {
    logger.info('Migrating KnowledgeBase vectors...');

    // Get all KnowledgeBase records with pineconeId
    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: {
        pineconeId: {
          not: null,
        },
      },
    });

    stats.knowledgeVectors = knowledgeBases.length;
    logger.info(`Found ${knowledgeBases.length} KnowledgeBase records to migrate`);

    for (const kb of knowledgeBases) {
      try {
        if (!kb.pineconeId) continue;

        // Fetch vector from Pinecone
        const fetchResponse = await pineconeIndex.fetch([kb.pineconeId]);
        const vector = fetchResponse.records[kb.pineconeId];

        if (!vector) {
          logger.warn(`Vector not found in Pinecone for KnowledgeBase ${kb.id}`);
          stats.failedVectors++;
          continue;
        }

        // Insert into pgvector (knowledge_chunks table)
        await prisma.$executeRaw`
          INSERT INTO knowledge_chunks (
            id,
            "knowledgeBaseId",
            content,
            "chunkIndex",
            tokens,
            embedding,
            metadata,
            "createdAt"
          ) VALUES (
            gen_random_uuid(),
            ${kb.id},
            ${kb.content},
            ${0},
            ${kb.content.split(' ').length}, -- Approximate token count
            ${`[${vector.values.join(',')}]`}::vector,
            ${JSON.stringify({
              category: kb.category,
              tags: kb.tags,
              source: kb.source,
              pineconeId: kb.pineconeId,
            })}::jsonb,
            NOW()
          )
          ON CONFLICT DO NOTHING
        `;

        stats.migratedVectors++;
        logger.info(`Migrated KnowledgeBase ${kb.id} (${stats.migratedVectors}/${stats.knowledgeVectors})`);
      } catch (error) {
        logger.error(`Failed to migrate KnowledgeBase ${kb.id}:`, error);
        stats.failedVectors++;
      }
    }

    logger.info(`KnowledgeBase migration: ${stats.migratedVectors} migrated, ${stats.failedVectors} failed`);
  } catch (error) {
    logger.error('KnowledgeBase migration failed:', error);
    throw error;
  }
}

async function migrateDocumentVectors(pineconeIndex: any, stats: MigrationStats): Promise<void> {
  try {
    logger.info('Migrating Document vectors...');

    // Get all Documents with pineconeIds
    const documents = await prisma.document.findMany({
      where: {
        pineconeIds: {
          isEmpty: false,
        },
      },
    });

    stats.documentVectors = documents.reduce((sum, doc) => sum + doc.pineconeIds.length, 0);
    logger.info(`Found ${documents.length} Documents with ${stats.documentVectors} vectors to migrate`);

    for (const doc of documents) {
      try {
        if (!doc.pineconeIds || doc.pineconeIds.length === 0) continue;

        // Fetch all vectors for this document from Pinecone
        const fetchResponse = await pineconeIndex.fetch(doc.pineconeIds);

        let chunkIndex = 0;
        for (const pineconeId of doc.pineconeIds) {
          const vector = fetchResponse.records[pineconeId];

          if (!vector) {
            logger.warn(`Vector ${pineconeId} not found in Pinecone for Document ${doc.id}`);
            stats.failedVectors++;
            continue;
          }

          // Insert into pgvector (document_chunks table)
          await prisma.$executeRaw`
            INSERT INTO document_chunks (
              id,
              "documentId",
              content,
              "chunkIndex",
              "pageNumber",
              tokens,
              embedding,
              "createdAt"
            ) VALUES (
              gen_random_uuid(),
              ${doc.id},
              ${vector.metadata?.content || ''},
              ${chunkIndex},
              ${vector.metadata?.pageNumber || null},
              ${vector.metadata?.tokens || 0},
              ${`[${vector.values.join(',')}]`}::vector,
              NOW()
            )
            ON CONFLICT DO NOTHING
          `;

          stats.migratedVectors++;
          chunkIndex++;
        }

        logger.info(`Migrated Document ${doc.id} (${doc.pineconeIds.length} chunks)`);
      } catch (error) {
        logger.error(`Failed to migrate Document ${doc.id}:`, error);
        stats.failedVectors++;
      }
    }

    logger.info(`Document migration: ${stats.migratedVectors} migrated, ${stats.failedVectors} failed`);
  } catch (error) {
    logger.error('Document migration failed:', error);
    throw error;
  }
}

async function migrateConversationVectors(pineconeIndex: any, stats: MigrationStats): Promise<void> {
  try {
    logger.info('Migrating ConversationSummary vectors...');

    // Get all ConversationSummary records with pineconeId
    const summaries = await prisma.conversationSummary.findMany({
      where: {
        pineconeId: {
          not: null,
        },
      },
    });

    stats.conversationVectors = summaries.length;
    logger.info(`Found ${summaries.length} ConversationSummary records to migrate`);

    for (const summary of summaries) {
      try {
        if (!summary.pineconeId) continue;

        // Fetch vector from Pinecone
        const fetchResponse = await pineconeIndex.fetch([summary.pineconeId]);
        const vector = fetchResponse.records[summary.pineconeId];

        if (!vector) {
          logger.warn(`Vector not found in Pinecone for ConversationSummary ${summary.id}`);
          stats.failedVectors++;
          continue;
        }

        // Update ConversationSummary with pgvector embedding
        await prisma.$executeRaw`
          UPDATE "ConversationSummary"
          SET embedding = ${`[${vector.values.join(',')}]`}::vector
          WHERE id = ${summary.id}
        `;

        stats.migratedVectors++;
        logger.info(
          `Migrated ConversationSummary ${summary.id} (${stats.migratedVectors}/${stats.conversationVectors})`
        );
      } catch (error) {
        logger.error(`Failed to migrate ConversationSummary ${summary.id}:`, error);
        stats.failedVectors++;
      }
    }

    logger.info(`ConversationSummary migration: ${stats.migratedVectors} migrated, ${stats.failedVectors} failed`);
  } catch (error) {
    logger.error('ConversationSummary migration failed:', error);
    throw error;
  }
}

async function verifyMigration(): Promise<void> {
  logger.info('Verifying migration...');

  const knowledgeChunks = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM knowledge_chunks WHERE embedding IS NOT NULL
  `;

  const documentChunks = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM document_chunks WHERE embedding IS NOT NULL
  `;

  const conversationEmbeddings = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "ConversationSummary" WHERE embedding IS NOT NULL
  `;

  logger.info('='.repeat(60));
  logger.info('Migration Verification:');
  logger.info(`  Knowledge chunks: ${knowledgeChunks[0].count}`);
  logger.info(`  Document chunks: ${documentChunks[0].count}`);
  logger.info(`  Conversation embeddings: ${conversationEmbeddings[0].count}`);
  logger.info(`  Total: ${Number(knowledgeChunks[0].count) + Number(documentChunks[0].count) + Number(conversationEmbeddings[0].count)}`);
  logger.info('='.repeat(60));
}

// Run migration
(async () => {
  try {
    const stats = await migratePineconeToPgvector();

    // Verify migration
    await verifyMigration();

    logger.info('✅ Migration completed successfully!');
    logger.info('💰 Cost savings: $70/mo -> $0 (Pinecone eliminated)');
    logger.info('');
    logger.info('Next steps:');
    logger.info('  1. Run performance benchmarks to compare Pinecone vs pgvector');
    logger.info('  2. Update all service imports to use new vector-store.service.ts');
    logger.info('  3. Remove Pinecone dependency from package.json');
    logger.info('  4. Delete Pinecone index (after confirming everything works)');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
})();
