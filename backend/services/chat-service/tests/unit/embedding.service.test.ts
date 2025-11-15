/**
 * Embedding Service Tests (Shared Service)
 *
 * Comprehensive tests for shared embedding generation service
 * Tests both OpenAI and Cloudflare providers
 * Target: 20+ tests, 70%+ coverage
 */

import { EmbeddingService, EmbeddingProvider, EmbeddingError } from '../../../../shared/services';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

// Mock Cloudflare AI Service
jest.mock('../../../../shared/services/cloudflare-ai.service', () => {
  return {
    CloudflareAIService: jest.fn().mockImplementation(() => ({
      isConfigured: jest.fn().mockReturnValue(false),
      generateEmbedding: jest.fn(),
      generateEmbeddingsBatch: jest.fn(),
      getEmbeddingDimension: jest.fn().mockReturnValue(768),
    })),
  };
});

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;
  let mockOpenAI: jest.Mocked<OpenAI>;
  let mockEmbeddingsCreate: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup OpenAI mock
    mockEmbeddingsCreate = jest.fn();
    mockOpenAI = {
      embeddings: {
        create: mockEmbeddingsCreate,
      },
    } as any;

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);

    // Create service instance with OpenAI provider
    embeddingService = new EmbeddingService({
      provider: EmbeddingProvider.OPENAI,
      openaiApiKey: 'test-api-key',
      maxRetries: 3,
    });
  });

  describe('Constructor', () => {
    test('should initialize with OpenAI provider', () => {
      expect(
        () =>
          new EmbeddingService({
            provider: EmbeddingProvider.OPENAI,
            openaiApiKey: 'test-key',
          })
      ).not.toThrow();
    });

    test('should initialize with Cloudflare provider', () => {
      expect(
        () =>
          new EmbeddingService({
            provider: EmbeddingProvider.CLOUDFLARE,
          })
      ).not.toThrow();
    });

    test('should auto-select provider when not specified', () => {
      const service = new EmbeddingService();
      expect(service.getProvider()).toBeDefined();
    });

    test('should return correct dimension for OpenAI models', () => {
      const service = new EmbeddingService({
        provider: EmbeddingProvider.OPENAI,
        openaiApiKey: 'test-key',
      });
      expect(service.getDimension()).toBe(1536); // text-embedding-3-small default
    });

    test('should return correct dimension for Cloudflare', () => {
      const service = new EmbeddingService({
        provider: EmbeddingProvider.CLOUDFLARE,
      });
      expect(service.getDimension()).toBe(768); // bge-base-en-v1.5
    });
  });

  describe('embedBatch()', () => {
    test('should return empty array for empty input', async () => {
      const result = await embeddingService.embedBatch([]);
      expect(result).toEqual({
        embeddings: [],
        totalTokens: 0,
        cacheHits: 0,
        cacheMisses: 0,
        totalCost: 0,
      });
      expect(mockEmbeddingsCreate).not.toHaveBeenCalled();
    });

    test('should generate embeddings for single text', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
        usage: { prompt_tokens: 10, total_tokens: 10 },
      };
      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      const result = await embeddingService.embedBatch(['test text']);

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: ['test text'],
        encoding_format: 'float',
      });
      expect(result.embeddings).toHaveLength(1);
      expect(result.embeddings[0].embedding).toEqual([0.1, 0.2, 0.3]);
      expect(result.totalTokens).toBe(10);
      expect(result.totalCost).toBeGreaterThan(0);
    });

    test('should generate embeddings for multiple texts', async () => {
      const mockResponse = {
        data: [
          { embedding: [0.1, 0.2], index: 0 },
          { embedding: [0.3, 0.4], index: 1 },
          { embedding: [0.5, 0.6], index: 2 },
        ],
        usage: { prompt_tokens: 30, total_tokens: 30 },
      };
      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      const result = await embeddingService.embedBatch(['text1', 'text2', 'text3']);

      expect(result.embeddings).toHaveLength(3);
      expect(result.totalTokens).toBe(30);
    });

    test('should handle batch processing for >100 texts', async () => {
      // Create 150 texts
      const texts = Array(150)
        .fill(null)
        .map((_, i) => `text ${i}`);

      const mockResponse = {
        data: Array(100)
          .fill(null)
          .map((_, i) => ({
            embedding: [0.1 * i, 0.2 * i],
            index: i,
          })),
        usage: { prompt_tokens: 100, total_tokens: 100 },
      };

      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      const result = await embeddingService.embedBatch(texts);

      // Should be called twice (100 + 50)
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(2);
      expect(result.embeddings).toHaveLength(150);
      expect(result.totalTokens).toBe(200); // 100 * 2
    });

    test('should throw EmbeddingError on API failure', async () => {
      mockEmbeddingsCreate.mockRejectedValue(new Error('API Error'));

      await expect(embeddingService.embedBatch(['test'])).rejects.toThrow(EmbeddingError);
    });
  });

  describe('embed() - Single Embedding', () => {
    test('should generate embedding for single text', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      };
      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      const result = await embeddingService.embed('test text');

      expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
      expect(result.tokens).toBe(5);
      expect(result.model).toBe('text-embedding-3-small');
      expect(result.provider).toBe(EmbeddingProvider.OPENAI);
      expect(result.cost).toBeGreaterThan(0);
    });

    test('should use cache on second call', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      };
      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      // First call
      const result1 = await embeddingService.embed('test text');
      expect(result1.cached).toBe(false);

      // Second call should use cache
      const result2 = await embeddingService.embed('test text');
      expect(result2.cached).toBe(true);
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(1); // Only called once
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should retry on 429 rate limit error', async () => {
      const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2], index: 0 }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      };

      mockEmbeddingsCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponse);

      const promise = embeddingService.embed('test');

      // Fast-forward through retries
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(3);
      expect(result.embedding).toEqual([0.1, 0.2]);
    });

    test('should retry on 500 server error', async () => {
      const serverError = { status: 500, message: 'Internal server error' };
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2], index: 0 }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      };

      mockEmbeddingsCreate.mockRejectedValueOnce(serverError).mockResolvedValueOnce(mockResponse);

      const promise = embeddingService.embed('test');
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(2);
      expect(result.embedding).toEqual([0.1, 0.2]);
    });

    test('should retry on 503 service unavailable', async () => {
      const serviceError = { status: 503, message: 'Service unavailable' };
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2], index: 0 }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      };

      mockEmbeddingsCreate.mockRejectedValueOnce(serviceError).mockResolvedValueOnce(mockResponse);

      const promise = embeddingService.embed('test');
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(2);
    });

    test('should NOT retry on 400 bad request', async () => {
      const badRequestError = { status: 400, message: 'Bad request' };

      mockEmbeddingsCreate.mockRejectedValue(badRequestError);

      await expect(embeddingService.embed('test')).rejects.toMatchObject({
        status: 400,
      });

      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(1);
    });

    test('should NOT retry on 401 unauthorized', async () => {
      const unauthorizedError = { status: 401, message: 'Unauthorized' };

      mockEmbeddingsCreate.mockRejectedValue(unauthorizedError);

      await expect(embeddingService.embed('test')).rejects.toMatchObject({
        status: 401,
      });

      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(1);
    });

    test('should stop after max retries', async () => {
      const rateLimitError = { status: 429, message: 'Rate limit exceeded' };

      mockEmbeddingsCreate.mockRejectedValue(rateLimitError);

      const promise = embeddingService.embed('test');
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toMatchObject({ status: 429 });

      // Should retry 3 times (maxRetries)
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(3);
    });

    test('should use exponential backoff with jitter', async () => {
      const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2], index: 0 }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      };

      mockEmbeddingsCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponse);

      const promise = embeddingService.embed('test');

      // Should wait for baseDelay * 2^0 + jitter = 1000-2000ms
      await jest.advanceTimersByTimeAsync(2000);

      // Should wait for baseDelay * 2^1 + jitter = 2000-3000ms
      await jest.advanceTimersByTimeAsync(3000);

      const result = await promise;

      expect(result.embedding).toEqual([0.1, 0.2]);
    });
  });

  describe('Cost Calculation', () => {
    test('should include cost in embedding result for OpenAI', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
        usage: { prompt_tokens: 1_000_000, total_tokens: 1_000_000 },
      };
      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      const result = await embeddingService.embed('test');

      // $0.02 per 1M tokens
      expect(result.cost).toBeCloseTo(0.02, 5);
    });

    test('should calculate cost correctly', () => {
      const cost1M = embeddingService.calculateCost(1_000_000, EmbeddingProvider.OPENAI);
      const cost500K = embeddingService.calculateCost(500_000, EmbeddingProvider.OPENAI);
      const cost100K = embeddingService.calculateCost(100_000, EmbeddingProvider.OPENAI);

      expect(cost1M).toBe(0.02);
      expect(cost500K).toBe(0.01);
      expect(cost100K).toBe(0.002);
    });

    test('should have minimal cost for Cloudflare', () => {
      const cost = embeddingService.calculateCost(1_000_000, EmbeddingProvider.CLOUDFLARE);
      expect(cost).toBe(0.0001); // Flat minimal fee
    });
  });

  describe('Model Dimensions', () => {
    test('should return 1536 for text-embedding-3-small (default)', () => {
      const service = new EmbeddingService({
        provider: EmbeddingProvider.OPENAI,
        openaiApiKey: 'test-key',
      });
      expect(service.getDimension()).toBe(1536);
    });

    test('should return 3072 for text-embedding-3-large', () => {
      expect(embeddingService.getDimension('text-embedding-3-large')).toBe(3072);
    });

    test('should return 1536 for text-embedding-ada-002', () => {
      expect(embeddingService.getDimension('text-embedding-ada-002')).toBe(1536);
    });

    test('should return 768 for Cloudflare provider', () => {
      const service = new EmbeddingService({
        provider: EmbeddingProvider.CLOUDFLARE,
      });
      expect(service.getDimension()).toBe(768);
    });
  });

  describe('Text Validation', () => {
    test('should validate normal text', () => {
      const result = embeddingService.validateText('This is a normal text');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject empty text', () => {
      const result = embeddingService.validateText('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text is empty');
    });

    test('should reject text exceeding max tokens', () => {
      // Create text with ~9000 tokens (9000 * 4 = 36000 chars)
      const longText = 'a'.repeat(36000);
      const result = embeddingService.validateText(longText);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Text too long');
      expect(result.error).toContain('9000');
    });

    test('should accept text near max token limit', () => {
      // Create text with ~8000 tokens (8000 * 4 = 32000 chars)
      const longText = 'a'.repeat(32000);
      const result = embeddingService.validateText(longText);
      expect(result.valid).toBe(true);
    });

    test('should reject empty string', () => {
      const result = embeddingService.validateText('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text is empty');
    });
  });

  describe('Batch Processing', () => {
    test('should process batches with 500ms delay', async () => {
      jest.useFakeTimers();

      const texts = Array(250)
        .fill(null)
        .map((_, i) => `text ${i}`);

      const mockResponse = {
        data: Array(100)
          .fill(null)
          .map((_, i) => ({
            embedding: [0.1 * i],
            index: i,
          })),
        usage: { prompt_tokens: 100, total_tokens: 100 },
      };

      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      const promise = embeddingService.embedBatch(texts);

      // Should process 3 batches: 100, 100, 50
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result.embeddings).toHaveLength(250);

      jest.useRealTimers();
    });

    test('should aggregate tokens from multiple batches', async () => {
      const texts = Array(150)
        .fill(null)
        .map((_, i) => `text ${i}`);

      const mockResponse = {
        data: Array(100)
          .fill(null)
          .map((_, i) => ({
            embedding: [0.1 * i],
            index: i,
          })),
        usage: { prompt_tokens: 100, total_tokens: 100 },
      };

      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      const result = await embeddingService.embedBatch(texts);

      expect(result.totalTokens).toBe(200); // 100 + 100
    });

    test('should throw error if batch fails', async () => {
      const texts = Array(150)
        .fill(null)
        .map((_, i) => `text ${i}`);

      mockEmbeddingsCreate
        .mockResolvedValueOnce({
          data: Array(100)
            .fill(null)
            .map((_, i) => ({ embedding: [0.1], index: i })),
          usage: { prompt_tokens: 100, total_tokens: 100 },
        })
        .mockRejectedValueOnce(new Error('Batch 2 failed'));

      await expect(embeddingService.embedBatch(texts)).rejects.toThrow(EmbeddingError);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should process single embedding in <500ms (mocked)', async () => {
      const mockResponse = {
        data: [{ embedding: Array(1536).fill(0.1), index: 0 }],
        usage: { prompt_tokens: 10, total_tokens: 10 },
      };
      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      await embeddingService.embed('test text');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should process batch of 100 texts in <1000ms (mocked)', async () => {
      const texts = Array(100)
        .fill(null)
        .map((_, i) => `text ${i}`);

      const mockResponse = {
        data: Array(100)
          .fill(null)
          .map((_, i) => ({ embedding: Array(1536).fill(0.1), index: i })),
        usage: { prompt_tokens: 1000, total_tokens: 1000 },
      };
      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      await embeddingService.embedBatch(texts);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      };
      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      // Generate embedding (should cache)
      await embeddingService.embed('test');
      expect(embeddingService.getCacheSize()).toBeGreaterThan(0);

      // Clear cache
      embeddingService.clearCache();
      expect(embeddingService.getCacheSize()).toBe(0);
    });

    test('should track cache size', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      };
      mockEmbeddingsCreate.mockResolvedValue(mockResponse);

      embeddingService.clearCache();
      expect(embeddingService.getCacheSize()).toBe(0);

      await embeddingService.embed('test1');
      await embeddingService.embed('test2');
      await embeddingService.embed('test3');

      expect(embeddingService.getCacheSize()).toBe(3);
    });
  });
});
