/**
 * AI Routes - Workers AI Integration
 *
 * FREE AI inference using Cloudflare Workers AI
 * - Embeddings: @cf/baai/bge-base-en-v1.5 (768d, FREE)
 * - LLM: Llama-2, Mistral (FREE for simple queries)
 * - Smart routing: Workers AI for simple, OpenAI for complex
 *
 * Cost Savings: 70-80% reduction by using Workers AI
 */

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware, userTierRateLimitMiddleware } from '../middleware/rate-limit';
import { getCachedResponse, setCachedResponse, generateCacheKey } from '../middleware/cache';
import { AI_MODELS, CACHE_TTL } from '../types/env';
import type { Env } from '../types/env';
import type { AuthUser } from '../middleware/auth';

const ai = new Hono<{ Bindings: Env }>();

// ════════════════════════════════════════════════════════════════
// EMBEDDINGS - 100% Workers AI (NO BACKEND!) ✨ FREE!
// ════════════════════════════════════════════════════════════════

/**
 * Generate Embeddings
 *
 * POST /api/ai/embeddings
 *
 * Body:
 * - text: string (single text)
 * - texts: string[] (batch processing)
 *
 * Response:
 * - embedding: number[] (768 dimensions)
 * - embeddings: number[][] (for batch)
 * - tokens: number
 * - cost: 0 (FREE!)
 */
ai.post('/embeddings',
  authMiddleware,
  userTierRateLimitMiddleware(),
  async (c) => {
    try {
      const body = await c.req.json();
      const { text, texts } = body;

      if (!text && !texts) {
        return c.json({
          error: 'Validation Error',
          message: 'Missing text or texts parameter',
          code: 'AI_001',
        }, 400);
      }

      const user = c.get('user') as AuthUser;
      const isBatch = Array.isArray(texts);
      const inputTexts = isBatch ? texts : [text];

      // Validate input
      if (inputTexts.length === 0) {
        return c.json({
          error: 'Validation Error',
          message: 'Empty texts array',
          code: 'AI_002',
        }, 400);
      }

      // Limit batch size
      const maxBatchSize = user.tier === 'free' ? 10 : user.tier === 'pro' ? 50 : 100;
      if (inputTexts.length > maxBatchSize) {
        return c.json({
          error: 'Validation Error',
          message: `Batch size exceeds limit of ${maxBatchSize} for ${user.tier} tier`,
          code: 'AI_003',
          upgrade: user.tier === 'free' ? {
            message: 'Upgrade to Pro for larger batch sizes',
            url: '/api/billing/upgrade',
          } : undefined,
        }, 400);
      }

      // Check cache for each text
      const results: any[] = [];
      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];

      for (let i = 0; i < inputTexts.length; i++) {
        const txt = inputTexts[i];
        const cacheKey = await generateCacheKey(txt, 'emb');
        const cached = await getCachedResponse(c, cacheKey);

        if (cached) {
          results[i] = cached;
        } else {
          uncachedTexts.push(txt);
          uncachedIndices.push(i);
        }
      }

      // Generate embeddings for uncached texts using Workers AI
      if (uncachedTexts.length > 0) {
        console.log(`[Workers AI] Generating ${uncachedTexts.length} embeddings (FREE!)`);

        try {
          // Workers AI: @cf/baai/bge-base-en-v1.5 (768 dimensions)
          const aiResponse = await c.env.AI.run(AI_MODELS.EMBEDDINGS, {
            text: uncachedTexts,
          });

          // Process results
          for (let i = 0; i < uncachedTexts.length; i++) {
            const embedding = aiResponse.data[i];
            const originalIndex = uncachedIndices[i];

            const result = {
              embedding,
              tokens: estimateTokens(uncachedTexts[i]),
              cost: 0,                      // FREE!
              provider: 'cloudflare',
              model: 'bge-base-en-v1.5',
              dimensions: 768,
            };

            results[originalIndex] = result;

            // Cache for 7 days (embeddings are deterministic)
            const cacheKey = await generateCacheKey(uncachedTexts[i], 'emb');
            c.executionCtx.waitUntil(
              setCachedResponse(c, cacheKey, result, CACHE_TTL.VERY_LONG)
            );
          }
        } catch (error) {
          console.error('[Workers AI] Embedding generation failed:', error);
          return c.json({
            error: 'AI Processing Error',
            message: 'Failed to generate embeddings',
            code: 'AI_004',
          }, 500);
        }
      }

      // Track usage in D1
      const totalTokens = results.reduce((sum, r) => sum + (r.tokens || 0), 0);

      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          INSERT INTO usage_tracking
          (user_id, service, provider, model, tokens, cost, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.id,
          'embeddings',
          'cloudflare',
          'bge-base-en-v1.5',
          totalTokens,
          0,                              // FREE!
          new Date().toISOString()
        ).run()
      );

      // Return response
      if (isBatch) {
        return c.json({
          embeddings: results.map(r => r.embedding),
          totalTokens,
          totalCost: 0,                   // FREE!
          provider: 'cloudflare',
          model: 'bge-base-en-v1.5',
          dimensions: 768,
          cached: results.length - uncachedTexts.length,
          savings: {
            message: 'Using FREE Cloudflare Workers AI!',
            vsOpenAI: `Saved $${(totalTokens / 1000 * 0.0001).toFixed(4)} (OpenAI ada-002)`,
          },
        });
      } else {
        return c.json({
          ...results[0],
          cached: uncachedTexts.length === 0,
        });
      }
    } catch (error) {
      console.error('[AI] Embeddings error:', error);
      return c.json({
        error: 'Internal Server Error',
        message: 'Embedding generation failed',
        code: 'AI_005',
      }, 500);
    }
  }
);

/**
 * Estimate tokens (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Get Embedding Dimensions
 *
 * GET /api/ai/embeddings/info
 */
ai.get('/embeddings/info', async (c) => {
  return c.json({
    model: 'bge-base-en-v1.5',
    provider: 'cloudflare',
    dimensions: 768,
    cost: 0,
    maxTokens: 512,
    description: 'FREE embeddings using Cloudflare Workers AI',
    performance: {
      latency: '<50ms (edge compute)',
      throughput: 'Unlimited (auto-scaling)',
    },
  });
});

// ════════════════════════════════════════════════════════════════
// LLM CHAT - Smart Routing (Workers AI for simple, OpenAI for complex)
// ════════════════════════════════════════════════════════════════

/**
 * Message format
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Analyze message complexity
 *
 * Heuristics to determine if query needs GPT-4 or can use free Workers AI
 */
function analyzeComplexity(messages: Message[]): 'simple' | 'medium' | 'complex' {
  const lastMessage = messages[messages.length - 1];
  const text = lastMessage.content;
  const tokens = estimateTokens(text);

  // Heuristics for complexity detection
  const hasCode = /```|function|class|import|const|let|var|def |async |await /.test(text);
  const hasAnalysis = /analyze|explain|compare|evaluate|reasoning|why|how does|debug/.test(text.toLowerCase());
  const hasMath = /\d+\s*[+\-*/^]\s*\d+|\bmath\b|\bcalculate\b|\bsolve\b/.test(text.toLowerCase());
  const isLong = tokens > 500;
  const hasContext = messages.length > 10;
  const multiStep = /step by step|first.*then|1\.|2\.|3\./.test(text.toLowerCase());

  // Complex if any of these are true
  if (hasCode || hasMath || multiStep || (hasAnalysis && isLong) || hasContext) {
    return 'complex';
  } else if (tokens > 100 || hasAnalysis) {
    return 'medium';
  } else {
    return 'simple';
  }
}

/**
 * Chat Completions
 *
 * POST /api/ai/chat/completions
 *
 * Body:
 * - messages: Message[]
 * - model?: string (optional override)
 * - forceProvider?: 'cloudflare' | 'openai'
 *
 * Smart routing:
 * - Simple queries → Workers AI Llama-2 (FREE)
 * - Medium queries → Workers AI Mistral (FREE)
 * - Complex queries → OpenAI GPT-4 (paid)
 */
ai.post('/chat/completions',
  authMiddleware,
  rateLimitMiddleware('ai/chat'),
  async (c) => {
    try {
      const body = await c.req.json();
      const { messages, model, forceProvider, stream = false } = body;

      if (!messages || !Array.isArray(messages)) {
        return c.json({
          error: 'Validation Error',
          message: 'Invalid messages array',
          code: 'AI_006',
        }, 400);
      }

      if (messages.length === 0) {
        return c.json({
          error: 'Validation Error',
          message: 'Empty messages array',
          code: 'AI_007',
        }, 400);
      }

      const user = c.get('user') as AuthUser;

      // Check cache (for non-streaming)
      if (!stream) {
        const cacheKey = await generateCacheKey(JSON.stringify(messages), 'chat');
        const cached = await getCachedResponse(c, cacheKey);

        if (cached) {
          return c.json({
            ...cached,
            cached: true,
          });
        }
      }

      // Determine provider based on complexity
      let provider: 'cloudflare' | 'openai';
      let selectedModel: string;

      if (forceProvider) {
        // User explicitly requested provider
        provider = forceProvider;
        selectedModel = model || (provider === 'cloudflare'
          ? AI_MODELS.MISTRAL_7B
          : 'gpt-4o');
      } else {
        // Smart routing based on complexity
        const complexity = analyzeComplexity(messages);

        if (complexity === 'simple') {
          provider = 'cloudflare';
          selectedModel = AI_MODELS.LLAMA_2_7B;
        } else if (complexity === 'medium') {
          provider = 'cloudflare';
          selectedModel = AI_MODELS.MISTRAL_7B;
        } else {
          // Complex query → use GPT-4
          // Free tier users get error to upgrade
          if (user.tier === 'free') {
            return c.json({
              error: 'Tier Limit',
              message: 'This query requires GPT-4. Upgrade to Pro for access.',
              code: 'AI_008',
              complexity,
              upgrade: {
                message: 'Upgrade to Pro for GPT-4 access',
                url: '/api/billing/upgrade',
                pricing: '$19/month - Unlimited GPT-4 queries',
              },
              fallback: {
                message: 'Or simplify your query to use free AI models',
                suggestion: 'Try breaking down your question into smaller parts',
              },
            }, 403);
          }

          provider = 'openai';
          selectedModel = model || 'gpt-4o';
        }
      }

      console.log(`[AI] Chat request - Complexity: ${analyzeComplexity(messages)}, Provider: ${provider}, Model: ${selectedModel}`);

      let response: any;
      let cost: number;

      if (provider === 'cloudflare') {
        // ✨ Workers AI - FREE!
        try {
          const aiResponse = await c.env.AI.run(selectedModel, {
            messages: messages.map((m: Message) => ({
              role: m.role,
              content: m.content,
            })),
          });

          response = {
            message: {
              role: 'assistant',
              content: aiResponse.response || '',
            },
            model: selectedModel,
            provider: 'cloudflare',
            tokens: estimateTokens(aiResponse.response || ''),
            cost: 0,                          // FREE!
            complexity: analyzeComplexity(messages),
          };

          cost = 0;
        } catch (error) {
          console.error('[Workers AI] Chat failed:', error);
          return c.json({
            error: 'AI Processing Error',
            message: 'Workers AI chat failed',
            code: 'AI_009',
          }, 500);
        }
      } else {
        // Proxy to backend for OpenAI GPT-4
        try {
          const backendResponse = await fetch(`${c.env.CHAT_SERVICE_URL}/api/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': c.req.header('Authorization') || '',
            },
            body: JSON.stringify({
              messages,
              model: selectedModel,
              stream,
            }),
          });

          if (!backendResponse.ok) {
            throw new Error(`Backend returned ${backendResponse.status}`);
          }

          response = await backendResponse.json();
          cost = response.cost || 0.015;     // Estimated GPT-4 cost
        } catch (error) {
          console.error('[OpenAI] Chat failed:', error);
          return c.json({
            error: 'AI Processing Error',
            message: 'OpenAI chat failed',
            code: 'AI_010',
          }, 500);
        }
      }

      // Cache response (1 hour) if not streaming
      if (!stream) {
        const cacheKey = await generateCacheKey(JSON.stringify(messages), 'chat');
        c.executionCtx.waitUntil(
          setCachedResponse(c, cacheKey, response, CACHE_TTL.MEDIUM)
        );
      }

      // Track usage in D1
      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          INSERT INTO usage_tracking
          (user_id, service, provider, model, tokens, cost, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.id,
          'chat',
          response.provider,
          response.model,
          response.tokens || 0,
          cost,
          new Date().toISOString()
        ).run()
      );

      // Update daily cost summary
      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          INSERT INTO cost_summary (date, total_cost, ${provider}_cost, total_requests, ${provider}_requests)
          VALUES (date('now'), ?, ?, 1, 1)
          ON CONFLICT(date) DO UPDATE SET
            total_cost = total_cost + excluded.total_cost,
            ${provider}_cost = ${provider}_cost + excluded.${provider}_cost,
            total_requests = total_requests + 1,
            ${provider}_requests = ${provider}_requests + 1
        `).bind(cost, cost).run()
      );

      // Add cost savings info
      if (provider === 'cloudflare') {
        response.savings = {
          message: 'Using FREE Cloudflare Workers AI!',
          vsOpenAI: `Saved $${(response.tokens / 1000 * 0.03).toFixed(4)} (vs GPT-4)`,
        };
      }

      return c.json(response);
    } catch (error) {
      console.error('[AI] Chat error:', error);
      return c.json({
        error: 'Internal Server Error',
        message: 'Chat completion failed',
        code: 'AI_011',
      }, 500);
    }
  }
);

/**
 * Get AI Models Info
 *
 * GET /api/ai/models
 */
ai.get('/models', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;

  return c.json({
    cloudflare: [
      {
        id: AI_MODELS.LLAMA_2_7B,
        name: 'Llama 2 7B',
        provider: 'cloudflare',
        cost: 0,
        tier: 'all',
        description: 'Fast, free LLM for simple queries',
      },
      {
        id: AI_MODELS.MISTRAL_7B,
        name: 'Mistral 7B',
        provider: 'cloudflare',
        cost: 0,
        tier: 'all',
        description: 'Free LLM for medium complexity',
      },
      {
        id: AI_MODELS.EMBEDDINGS,
        name: 'BGE Base EN v1.5',
        provider: 'cloudflare',
        cost: 0,
        tier: 'all',
        type: 'embeddings',
        dimensions: 768,
      },
    ],
    openai: user.tier !== 'free' ? [
      {
        id: 'gpt-4o',
        name: 'GPT-4 Optimized',
        provider: 'openai',
        cost: 0.03,      // per 1K tokens
        tier: 'pro+',
        description: 'Advanced reasoning and coding',
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        cost: 0.002,     // per 1K tokens
        tier: 'pro+',
      },
    ] : [],
  });
});

export default ai;
