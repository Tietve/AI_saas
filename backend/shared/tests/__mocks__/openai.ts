// Mock implementation for OpenAI SDK
// This file resolves "SyntaxError: Cannot use import statement outside a module" errors

export class OpenAI {
  apiKey: string;

  constructor(config?: { apiKey?: string }) {
    this.apiKey = config?.apiKey || 'test-api-key';
  }

  embeddings = {
    create: jest.fn().mockResolvedValue({
      data: [
        {
          embedding: Array(1536).fill(0.1),
          index: 0,
          object: 'embedding'
        }
      ],
      model: 'text-embedding-ada-002',
      object: 'list',
      usage: {
        prompt_tokens: 10,
        total_tokens: 10
      }
    })
  };

  chat = {
    completions: {
      create: jest.fn().mockResolvedValue({
        id: 'chatcmpl-test',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a test response'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      })
    }
  };
}

export default OpenAI;
