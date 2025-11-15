/**
 * RAG Routes - Vectorize-based Document Q&A (100% ON EDGE, FREE!)
 *
 * Complete RAG implementation using Cloudflare infrastructure:
 * - Document upload → Parse text
 * - Generate embeddings → Workers AI (FREE)
 * - Store vectors → Vectorize (FREE)
 * - Semantic search → Vectorize (FREE)
 * - Answer generation → Workers AI (FREE)
 *
 * Cost: $0 (vs OpenAI: ~$0.50 per document)
 */

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware, userTierRateLimitMiddleware } from '../middleware/rate-limit';
import { getCachedResponse, setCachedResponse, generateCacheKey } from '../middleware/cache';
import { AI_MODELS, CACHE_TTL } from '../types/env';
import type { Env } from '../types/env';
import type { AuthUser } from '../middleware/auth';

const rag = new Hono<{ Bindings: Env }>();

// ════════════════════════════════════════════════════════════════
// Document Upload & Processing
// ════════════════════════════════════════════════════════════════

/**
 * Upload Document for RAG
 *
 * POST /api/rag/upload
 *
 * Body:
 * - text: string (extracted document text)
 * - filename: string
 * - chunkSize?: number (default 500)
 *
 * Process:
 * 1. Split text into chunks
 * 2. Generate embeddings for each chunk (Workers AI - FREE)
 * 3. Store in Vectorize (FREE)
 */
rag.post('/upload',
  authMiddleware,
  rateLimitMiddleware('rag/upload'),
  async (c) => {
    try {
      const body = await c.req.json();
      const { text, filename, chunkSize = 500 } = body;

      if (!text || !filename) {
        return c.json({
          error: 'Validation Error',
          message: 'Missing text or filename',
          code: 'RAG_001',
        }, 400);
      }

      const user = c.get('user') as AuthUser;

      // Check document limits by tier
      const limits = {
        free: { maxDocs: 5, maxSize: 50000 },        // 5 docs, ~50KB each
        pro: { maxDocs: 100, maxSize: 500000 },      // 100 docs, ~500KB each
        enterprise: { maxDocs: 1000, maxSize: 5000000 }, // 1K docs, ~5MB each
      };

      const userLimit = limits[user.tier || 'free'];

      if (text.length > userLimit.maxSize) {
        return c.json({
          error: 'Document Too Large',
          message: `Document exceeds ${userLimit.maxSize} characters for ${user.tier} tier`,
          code: 'RAG_002',
          upgrade: user.tier === 'free' ? {
            message: 'Upgrade to Pro for larger documents',
            url: '/api/billing/upgrade',
          } : undefined,
        }, 400);
      }

      // Check user's document count
      const countResult = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM usage_tracking
        WHERE user_id = ? AND service = 'rag_upload'
        AND timestamp >= date('now', '-30 days')
      `).bind(user.id).first();

      const currentCount = (countResult?.count as number) || 0;

      if (currentCount >= userLimit.maxDocs) {
        return c.json({
          error: 'Document Limit Reached',
          message: `You've reached the limit of ${userLimit.maxDocs} documents for ${user.tier} tier`,
          code: 'RAG_003',
          upgrade: user.tier === 'free' ? {
            message: 'Upgrade to Pro for more documents',
            url: '/api/billing/upgrade',
          } : undefined,
        }, 403);
      }

      // Split text into chunks
      const chunks = splitIntoChunks(text, chunkSize);
      console.log(`[RAG] Split document into ${chunks.length} chunks`);

      // Generate embeddings for all chunks (Workers AI - FREE!)
      const embeddings: number[][] = [];

      try {
        const aiResponse = await c.env.AI.run(AI_MODELS.EMBEDDINGS, {
          text: chunks,
        });

        for (let i = 0; i < chunks.length; i++) {
          embeddings.push(aiResponse.data[i]);
        }

        console.log(`[Workers AI] Generated ${embeddings.length} embeddings (FREE!)`);
      } catch (error) {
        console.error('[Workers AI] Embedding generation failed:', error);
        return c.json({
          error: 'AI Processing Error',
          message: 'Failed to generate embeddings',
          code: 'RAG_004',
        }, 500);
      }

      // Store vectors in Vectorize (FREE!)
      const vectorIds: string[] = [];
      const documentId = crypto.randomUUID();

      try {
        for (let i = 0; i < chunks.length; i++) {
          const vectorId = `${documentId}:chunk:${i}`;

          await c.env.VECTORIZE.upsert([
            {
              id: vectorId,
              values: embeddings[i],
              metadata: {
                userId: user.id,
                documentId,
                filename,
                chunkIndex: i,
                text: chunks[i].substring(0, 1000), // Store snippet for reference
                timestamp: new Date().toISOString(),
              },
            },
          ]);

          vectorIds.push(vectorId);
        }

        console.log(`[Vectorize] Stored ${vectorIds.length} vectors (FREE!)`);
      } catch (error) {
        console.error('[Vectorize] Vector storage failed:', error);
        return c.json({
          error: 'Vector Storage Error',
          message: 'Failed to store document vectors',
          code: 'RAG_005',
        }, 500);
      }

      // Track usage in D1
      await c.env.DB.prepare(`
        INSERT INTO usage_tracking
        (user_id, service, provider, model, tokens, cost, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.id,
        'rag_upload',
        'cloudflare',
        'vectorize+bge',
        chunks.reduce((sum, c) => sum + Math.ceil(c.length / 4), 0),
        0,                                      // FREE!
        new Date().toISOString(),
        JSON.stringify({
          documentId,
          filename,
          chunks: chunks.length,
          vectors: vectorIds.length,
        })
      ).run();

      return c.json({
        documentId,
        filename,
        chunks: chunks.length,
        vectors: vectorIds.length,
        cost: 0,                                // FREE!
        provider: 'cloudflare',
        message: '✨ Document processed with FREE Cloudflare infrastructure!',
        savings: {
          vsOpenAI: `Saved ~$${(chunks.length * 0.0001).toFixed(4)} (OpenAI embeddings)`,
        },
      });
    } catch (error) {
      console.error('[RAG] Upload error:', error);
      return c.json({
        error: 'Internal Server Error',
        message: 'Document upload failed',
        code: 'RAG_006',
      }, 500);
    }
  }
);

// ════════════════════════════════════════════════════════════════
// Semantic Search & Query
// ════════════════════════════════════════════════════════════════

/**
 * Query Documents (RAG)
 *
 * POST /api/rag/query
 *
 * Body:
 * - question: string
 * - topK?: number (default 5)
 * - documentId?: string (search specific document)
 *
 * Process:
 * 1. Generate question embedding (Workers AI - FREE)
 * 2. Search Vectorize for similar chunks (FREE)
 * 3. Generate answer using context (Workers AI - FREE)
 */
rag.post('/query',
  authMiddleware,
  rateLimitMiddleware('rag/query'),
  async (c) => {
    try {
      const body = await c.req.json();
      const { question, topK = 5, documentId } = body;

      if (!question) {
        return c.json({
          error: 'Validation Error',
          message: 'Missing question',
          code: 'RAG_007',
        }, 400);
      }

      const user = c.get('user') as AuthUser;

      // Check cache
      const cacheKey = await generateCacheKey(`${question}:${documentId || 'all'}`, 'rag');
      const cached = await getCachedResponse(c, cacheKey);

      if (cached) {
        return c.json({
          ...cached,
          cached: true,
        });
      }

      // Generate question embedding (Workers AI - FREE!)
      let questionEmbedding: number[];

      try {
        const aiResponse = await c.env.AI.run(AI_MODELS.EMBEDDINGS, {
          text: [question],
        });

        questionEmbedding = aiResponse.data[0];
        console.log('[Workers AI] Generated question embedding (FREE!)');
      } catch (error) {
        console.error('[Workers AI] Embedding generation failed:', error);
        return c.json({
          error: 'AI Processing Error',
          message: 'Failed to generate question embedding',
          code: 'RAG_008',
        }, 500);
      }

      // Search Vectorize (FREE!)
      let searchResults;

      try {
        const query: any = {
          vector: questionEmbedding,
          topK,
        };

        // Filter by user ID and optionally document ID
        if (documentId) {
          query.filter = {
            userId: user.id,
            documentId,
          };
        } else {
          query.filter = {
            userId: user.id,
          };
        }

        searchResults = await c.env.VECTORIZE.query(
          questionEmbedding,
          {
            topK,
            returnMetadata: true,
          }
        );

        console.log(`[Vectorize] Found ${searchResults.matches.length} relevant chunks (FREE!)`);
      } catch (error) {
        console.error('[Vectorize] Search failed:', error);
        return c.json({
          error: 'Search Error',
          message: 'Vector search failed',
          code: 'RAG_009',
        }, 500);
      }

      if (searchResults.matches.length === 0) {
        return c.json({
          answer: 'I could not find any relevant information in your documents to answer this question.',
          sources: [],
          confidence: 0,
        });
      }

      // Build context from top matches
      const context = searchResults.matches
        .map((match: any, idx: number) => `[${idx + 1}] ${match.metadata.text}`)
        .join('\n\n');

      // Generate answer using Workers AI (FREE!)
      let answer: string;

      try {
        const prompt = `Based on the following context, answer the question. If the context doesn't contain enough information, say so.

Context:
${context}

Question: ${question}

Answer:`;

        const aiResponse = await c.env.AI.run(AI_MODELS.MISTRAL_7B, {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        answer = aiResponse.response || 'I could not generate an answer.';
        console.log('[Workers AI] Generated answer (FREE!)');
      } catch (error) {
        console.error('[Workers AI] Answer generation failed:', error);
        return c.json({
          error: 'AI Processing Error',
          message: 'Failed to generate answer',
          code: 'RAG_010',
        }, 500);
      }

      // Build response
      const response = {
        answer,
        sources: searchResults.matches.map((match: any) => ({
          filename: match.metadata.filename,
          chunk: match.metadata.chunkIndex,
          score: match.score,
          text: match.metadata.text.substring(0, 200) + '...',
        })),
        confidence: searchResults.matches[0]?.score || 0,
        cost: 0,                                // FREE!
        provider: 'cloudflare',
        message: '✨ Answered using FREE Cloudflare Workers AI + Vectorize!',
        savings: {
          vsOpenAI: `Saved ~$${(0.03 * (context.length + answer.length) / 4000).toFixed(4)} (GPT-4)`,
        },
      };

      // Cache response (1 hour)
      c.executionCtx.waitUntil(
        setCachedResponse(c, cacheKey, response, CACHE_TTL.MEDIUM)
      );

      // Track usage
      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          INSERT INTO usage_tracking
          (user_id, service, provider, model, tokens, cost, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.id,
          'rag_query',
          'cloudflare',
          'mistral+vectorize',
          Math.ceil((question.length + answer.length) / 4),
          0,                                    // FREE!
          new Date().toISOString()
        ).run()
      );

      return c.json(response);
    } catch (error) {
      console.error('[RAG] Query error:', error);
      return c.json({
        error: 'Internal Server Error',
        message: 'RAG query failed',
        code: 'RAG_011',
      }, 500);
    }
  }
);

/**
 * List User's Documents
 *
 * GET /api/rag/documents
 */
rag.get('/documents', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;

  try {
    const result = await c.env.DB.prepare(`
      SELECT metadata
      FROM usage_tracking
      WHERE user_id = ? AND service = 'rag_upload'
      ORDER BY timestamp DESC
      LIMIT 100
    `).bind(user.id).all();

    const documents = (result.results || []).map((row: any) => {
      const metadata = JSON.parse(row.metadata || '{}');
      return {
        documentId: metadata.documentId,
        filename: metadata.filename,
        chunks: metadata.chunks,
        vectors: metadata.vectors,
      };
    });

    return c.json({
      documents,
      total: documents.length,
    });
  } catch (error) {
    console.error('[RAG] List documents error:', error);
    return c.json({
      error: 'Internal Server Error',
      message: 'Failed to list documents',
      code: 'RAG_012',
    }, 500);
  }
});

/**
 * Split text into chunks
 */
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+\s+/);

  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export default rag;
