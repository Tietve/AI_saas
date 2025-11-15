/**
 * Embedding Service Test Suite
 * Tests for unified embedding service with OpenAI and Cloudflare providers
 */

// Mock OpenAI before imports
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn()
    }
  }))
}));

import { EmbeddingService } from '../embedding.service';
import { EmbeddingProvider, EmbeddingError } from '../types';
import { CloudflareAIService } from '../cloudflare-ai.service';

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;
  let mockOpenAIClient: any;
  let mockCloudflareAI: jest.Mocked<CloudflareAIService>;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Cloudflare AI Service
    mockCloudflareAI = {
      isConfigured: jest.fn().mockReturnValue(false),
      generateEmbedding: jest.fn(),
      generateEmbeddingsBatch: jest.fn(),
      getEmbeddingDimension: jest.fn().mockReturnValue(768),
    } as any;

    // Create service instance with mocked dependencies
    embeddingService = new EmbeddingService({
      provider: EmbeddingProvider.OPENAI,
      openaiApiKey: 'test-api-key',
      cloudflareAI: mockCloudflareAI,
    });

    // Initialize OpenAI client asynchronously
    await (embeddingService as any).initOpenAIClient('test-api-key');

    // Setup mock embeddings.create method
    mockOpenAIClient = (embeddingService as any).openaiClient;
    if (mockOpenAIClient) {
      mockOpenAIClient.embeddings = {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: Array(1536).fill(0.1) }],
          usage: { prompt_tokens: 5, total_tokens: 10 },
        }),
      };
    }
  });

  afterEach(() => {
    embeddingService.clearCache();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with OpenAI provider by default', () => {
      const service = new EmbeddingService({
        openaiApiKey: 'test-key',
        cloudflareAI: mockCloudflareAI,
      });
      expect(service.getProvider()).toBe(EmbeddingProvider.OPENAI);
    });

    test('should prefer Cloudflare if configured', () => {
      mockCloudflareAI.isConfigured.mockReturnValue(true);
      const service = new EmbeddingService({
        cloudflareAI: mockCloudflareAI,
      });
      expect(service.getProvider()).toBe(EmbeddingProvider.CLOUDFLARE);
    });

    test('should allow setting custom max retries', () => {
      const service = new EmbeddingService({
        maxRetries: 3,
        openaiApiKey: 'test-key',
      });
      expect((service as any).maxRetries).toBe(3);
    });
  });

  describe('Provider Management', () => {
    test('should switch provider', () => {
      embeddingService.setProvider(EmbeddingProvider.CLOUDFLARE);
      expect(embeddingService.getProvider()).toBe(EmbeddingProvider.CLOUDFLARE);
    });

    test('should get current provider', () => {
      expect(embeddingService.getProvider()).toBe(EmbeddingProvider.OPENAI);
    });
  });

  describe('Text Validation', () => {
    test('should validate normal text', () => {
      const result = embeddingService.validateText('Hello world');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject empty text', () => {
      const result = embeddingService.validateText('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    test('should reject text that is too long', () => {
      const longText = 'a'.repeat(40000); // ~10,000 tokens
      const result = embeddingService.validateText(longText);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('OpenAI Embedding Generation', () => {
    test('should generate single embedding with OpenAI', async () => {
      const mockResponse = {
        data: [
          {
            embedding: Array(1536).fill(0.1),
            index: 0,
          },
        ],
        usage: {
          prompt_tokens: 5,
          total_tokens: 10,
        },
      };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest.fn().mockResolvedValue(mockResponse);
      }

      const result = await embeddingService.embed('Test text');

      expect(result.embedding).toHaveLength(1536);
      expect(result.tokens).toBe(10);
      expect(result.provider).toBe(EmbeddingProvider.OPENAI);
      expect(result.cached).toBe(false);
      expect(result.cost).toBeGreaterThan(0);
    });

    test('should use cache for repeated embeddings', async () => {
      const mockResponse = {
        data: [{ embedding: Array(1536).fill(0.1) }],
        usage: { total_tokens: 10 },
      };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest.fn().mockResolvedValue(mockResponse);
      }

      // First call - cache miss
      const result1 = await embeddingService.embed('Test text');
      expect(result1.cached).toBe(false);

      // Second call - cache hit
      const result2 = await embeddingService.embed('Test text');
      expect(result2.cached).toBe(true);

      // OpenAI should only be called once
      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        expect(mockOpenAIClient.embeddings.create).toHaveBeenCalledTimes(1);
      }
    });

    test('should disable cache when specified', async () => {
      const mockResponse = {
        data: [{ embedding: Array(1536).fill(0.1) }],
        usage: { total_tokens: 10 },
      };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest.fn().mockResolvedValue(mockResponse);
      }

      await embeddingService.embed('Test', { useCache: false });
      await embeddingService.embed('Test', { useCache: false });

      // Should be called twice (no caching)
      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        expect(mockOpenAIClient.embeddings.create).toHaveBeenCalledTimes(2);
      }
    });

    test('should handle OpenAI API errors', async () => {
      // Create a client error (400) which won't retry
      const clientError = Object.assign(new Error('Bad Request'), { status: 400 });

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest
          .fn()
          .mockRejectedValue(clientError);
      }

      await expect(embeddingService.embed('Test')).rejects.toThrow(EmbeddingError);
    });
  });

  describe('Cloudflare Embedding Generation', () => {
    beforeEach(() => {
      embeddingService.setProvider(EmbeddingProvider.CLOUDFLARE);
    });

    test('should generate single embedding with Cloudflare', async () => {
      const mockCfResult = {
        embedding: Array(768).fill(0.2),
        tokens: 5,
        model: '@cf/baai/bge-base-en-v1.5',
      };

      mockCloudflareAI.generateEmbedding.mockResolvedValue(mockCfResult);

      const result = await embeddingService.embed('Test text');

      expect(result.embedding).toHaveLength(768);
      expect(result.tokens).toBe(5);
      expect(result.provider).toBe(EmbeddingProvider.CLOUDFLARE);
      expect(result.model).toBe('@cf/baai/bge-base-en-v1.5');
    });

    test('should handle Cloudflare errors', async () => {
      mockCloudflareAI.generateEmbedding.mockRejectedValue(new Error('CF Error'));

      await expect(embeddingService.embed('Test')).rejects.toThrow(EmbeddingError);
    });
  });

  describe('Batch Embedding Generation', () => {
    test('should handle empty batch', async () => {
      const result = await embeddingService.embedBatch([]);

      expect(result.embeddings).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
      expect(result.cacheHits).toBe(0);
      expect(result.cacheMisses).toBe(0);
    });

    test('should generate batch embeddings with OpenAI', async () => {
      const mockResponse = {
        data: [
          { embedding: Array(1536).fill(0.1) },
          { embedding: Array(1536).fill(0.2) },
        ],
        usage: { total_tokens: 20 },
      };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest.fn().mockResolvedValue(mockResponse);
      }

      const result = await embeddingService.embedBatch(['Text 1', 'Text 2']);

      expect(result.embeddings).toHaveLength(2);
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(result.cacheMisses).toBe(2);
      expect(result.cacheHits).toBe(0);
    });

    test('should use cache for batch embeddings', async () => {
      const mockResponse = {
        data: [
          { embedding: Array(1536).fill(0.1) },
          { embedding: Array(1536).fill(0.2) },
        ],
        usage: { total_tokens: 20 },
      };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest.fn().mockResolvedValue(mockResponse);
      }

      // First batch
      await embeddingService.embedBatch(['Text 1', 'Text 2']);

      // Second batch with one repeated text
      const result = await embeddingService.embedBatch(['Text 1', 'Text 3']);

      expect(result.cacheHits).toBe(1); // 'Text 1' cached
      expect(result.cacheMisses).toBe(1); // 'Text 3' not cached
    });

    test('should generate batch with Cloudflare', async () => {
      embeddingService.setProvider(EmbeddingProvider.CLOUDFLARE);

      const mockCfResults = [
        { embedding: Array(768).fill(0.1), tokens: 5, model: 'cf-model' },
        { embedding: Array(768).fill(0.2), tokens: 5, model: 'cf-model' },
      ];

      mockCloudflareAI.generateEmbeddingsBatch.mockResolvedValue(mockCfResults);

      const result = await embeddingService.embedBatch(['Text 1', 'Text 2']);

      expect(result.embeddings).toHaveLength(2);
      expect(result.embeddings[0].provider).toBe(EmbeddingProvider.CLOUDFLARE);
    });
  });

  describe('Cosine Similarity', () => {
    test('should calculate cosine similarity correctly', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      const similarity = embeddingService.cosineSimilarity(vec1, vec2);
      expect(similarity).toBe(0);
    });

    test('should return 1 for identical vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2, 3];
      const similarity = embeddingService.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(1, 5);
    });

    test('should throw error for different dimensions', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2];
      expect(() => embeddingService.cosineSimilarity(vec1, vec2)).toThrow(EmbeddingError);
    });
  });

  describe('Cost Calculation', () => {
    test('should calculate OpenAI cost correctly', () => {
      const cost = embeddingService.calculateCost(1000, EmbeddingProvider.OPENAI);
      expect(cost).toBeCloseTo(0.00002, 8); // $0.02 per 1M tokens
    });

    test('should calculate Cloudflare cost correctly', () => {
      const cost = embeddingService.calculateCost(1000, EmbeddingProvider.CLOUDFLARE);
      expect(cost).toBe(0.0001);
    });
  });

  describe('Model Dimension', () => {
    test('should return correct dimension for OpenAI models', () => {
      expect(embeddingService.getDimension('text-embedding-3-small')).toBe(1536);
      expect(embeddingService.getDimension('text-embedding-3-large')).toBe(3072);
      expect(embeddingService.getDimension('text-embedding-ada-002')).toBe(1536);
    });

    test('should return Cloudflare dimension when using Cloudflare', () => {
      embeddingService.setProvider(EmbeddingProvider.CLOUDFLARE);
      expect(embeddingService.getDimension()).toBe(768);
    });

    test('should return default dimension for unknown model', () => {
      expect(embeddingService.getDimension('unknown-model')).toBe(1536);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache', async () => {
      const mockResponse = {
        data: [{ embedding: Array(1536).fill(0.1) }],
        usage: { total_tokens: 10 },
      };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest.fn().mockResolvedValue(mockResponse);
      }

      await embeddingService.embed('Test');
      expect(embeddingService.getCacheSize()).toBeGreaterThan(0);

      embeddingService.clearCache();
      expect(embeddingService.getCacheSize()).toBe(0);
    });

    test('should get cache size', async () => {
      const mockResponse = {
        data: [{ embedding: Array(1536).fill(0.1) }],
        usage: { total_tokens: 10 },
      };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest.fn().mockResolvedValue(mockResponse);
      }

      expect(embeddingService.getCacheSize()).toBe(0);

      await embeddingService.embed('Test 1');
      await embeddingService.embed('Test 2');

      expect(embeddingService.getCacheSize()).toBe(2);
    });
  });

  describe('Retry Logic', () => {
    test('should retry on 429 rate limit error', async () => {
      const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
      const mockResponse = {
        data: [{ embedding: Array(1536).fill(0.1) }],
        usage: { total_tokens: 10 },
      };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest
          .fn()
          .mockRejectedValueOnce(rateLimitError)
          .mockResolvedValueOnce(mockResponse);
      }

      const result = await embeddingService.embed('Test');
      expect(result.embedding).toBeDefined();
    });

    test('should not retry on 400 client errors', async () => {
      const clientError = { status: 400, message: 'Bad request' };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest.fn().mockRejectedValue(clientError);
      }

      await expect(embeddingService.embed('Test')).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long text near the limit', () => {
      const text = 'a'.repeat(32760); // ~8190 tokens (just under limit)
      const validation = embeddingService.validateText(text);
      expect(validation.valid).toBe(true);
    });

    test('should handle special characters', async () => {
      const mockResponse = {
        data: [{ embedding: Array(1536).fill(0.1) }],
        usage: { total_tokens: 10 },
      };

      if (mockOpenAIClient && mockOpenAIClient.embeddings) {
        mockOpenAIClient.embeddings.create = jest.fn().mockResolvedValue(mockResponse);
      }

      const specialText = '你好世界 🌍 привет мир';
      const result = await embeddingService.embed(specialText);
      expect(result.embedding).toBeDefined();
    });

    test('should handle whitespace-only text correctly', () => {
      const validation = embeddingService.validateText('\t\n  \r\n  ');
      expect(validation.valid).toBe(false);
    });
  });
});
