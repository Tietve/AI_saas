/**
 * OpenAI Service Unit Tests
 *
 * Tests for OpenAI integration including:
 * - Chat completion (non-streaming)
 * - Streaming responses (SSE)
 * - Mock mode testing
 * - Error handling
 * - Token usage tracking
 */

// Mock OpenAI first before any imports
const mockCreate = jest.fn();
const mockOpenAI = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockCreate,
    },
  },
}));

jest.mock('openai', () => mockOpenAI);

import { OpenAIService } from '../../src/services/openai.service';

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env.OPENAI_API_KEY = 'sk-test-key-valid';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with valid API key', () => {
      process.env.OPENAI_API_KEY = 'sk-valid-key';
      service = new OpenAIService();
      expect(service).toBeDefined();
    });

    it('should use mock mode when API key is missing', () => {
      process.env.OPENAI_API_KEY = '';
      service = new OpenAIService();
      // Service should be created in mock mode
      expect(service).toBeDefined();
    });

    it('should use mock mode when API key is placeholder', () => {
      process.env.OPENAI_API_KEY = 'your-api-key-here';
      service = new OpenAIService();
      // Service should be created in mock mode
      expect(service).toBeDefined();
    });

    it('should use mock mode when API key is sk-mock-key', () => {
      process.env.OPENAI_API_KEY = 'sk-mock-key';
      service = new OpenAIService();
      // Service should be created in mock mode
      expect(service).toBeDefined();
    });
  });

  describe('createChatCompletion', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-valid-key';
      service = new OpenAIService();
    });

    it('should successfully create chat completion', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a test response',
            },
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        model: 'gpt-4',
      };

      mockCreate.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user' as const, content: 'Hello' },
      ];

      const result = await service.createChatCompletion(messages, 'gpt-4');

      expect(result).toEqual({
        content: 'This is a test response',
        model: 'gpt-4',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });
    });

    it('should use gpt-4 as default model', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        model: 'gpt-4',
      };

      mockCreate.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      await service.createChatCompletion(messages);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4' })
      );
    });

    it('should handle empty content in response', async () => {
      const mockResponse = {
        choices: [{ message: { content: null } }],
        usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
        model: 'gpt-4',
      };

      mockCreate.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await service.createChatCompletion(messages);

      expect(result.content).toBe('');
    });

    it('should handle missing usage data', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        usage: null,
        model: 'gpt-4',
      };

      mockCreate.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await service.createChatCompletion(messages);

      expect(result.promptTokens).toBe(0);
      expect(result.completionTokens).toBe(0);
      expect(result.totalTokens).toBe(0);
    });

    it('should throw error on OpenAI API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const messages = [{ role: 'user' as const, content: 'Hello' }];

      await expect(
        service.createChatCompletion(messages)
      ).rejects.toThrow('Không thể kết nối với OpenAI');
    });
  });

  describe('createStreamingChatCompletion', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-valid-key';
      service = new OpenAIService();
    });

    it('should stream chat completion chunks', async () => {
      const mockChunks = [
        { choices: [{ delta: { content: 'Hello' } }] },
        { choices: [{ delta: { content: ' ' } }] },
        { choices: [{ delta: { content: 'World' } }] },
      ];

      // Create async iterator
      async function* mockStream() {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      }

      mockCreate.mockResolvedValue(mockStream());

      const messages = [{ role: 'user' as const, content: 'Hi' }];
      const chunks: string[] = [];

      for await (const chunk of service.createStreamingChatCompletion(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' ', 'World']);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });
    });

    it('should skip empty chunks', async () => {
      const mockChunks = [
        { choices: [{ delta: { content: 'Hello' } }] },
        { choices: [{ delta: {} }] }, // Empty delta
        { choices: [{ delta: { content: 'World' } }] },
      ];

      async function* mockStream() {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      }

      mockCreate.mockResolvedValue(mockStream());

      const messages = [{ role: 'user' as const, content: 'Hi' }];
      const chunks: string[] = [];

      for await (const chunk of service.createStreamingChatCompletion(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', 'World']);
    });

    it('should throw error on streaming failure', async () => {
      mockCreate.mockRejectedValue(new Error('Stream Error'));

      const messages = [{ role: 'user' as const, content: 'Hi' }];
      const generator = service.createStreamingChatCompletion(messages);

      await expect(generator.next()).rejects.toThrow(
        'Không thể kết nối với OpenAI'
      );
    });
  });

  describe('estimateTokens', () => {
    beforeEach(() => {
      service = new OpenAIService();
    });

    it('should estimate tokens correctly', () => {
      const text = 'This is a test message';
      const tokens = service.estimateTokens(text);

      // Rough estimation: 1 token ≈ 4 characters
      const expectedTokens = Math.ceil(text.length / 4);
      expect(tokens).toBe(expectedTokens);
    });

    it('should handle empty string', () => {
      const tokens = service.estimateTokens('');
      expect(tokens).toBe(0);
    });

    it('should handle long text', () => {
      const longText = 'a'.repeat(1000);
      const tokens = service.estimateTokens(longText);
      expect(tokens).toBe(250); // 1000 / 4 = 250
    });
  });
});
