/**
 * OpenAI Mock
 */

export const mockOpenAICompletion = {
  choices: [
    {
      message: {
        content: 'This is a mock AI response',
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
  },
  model: 'gpt-4',
};

export const mockOpenAIStreamChunk = (content: string) => ({
  choices: [
    {
      delta: {
        content,
      },
    },
  ],
});

export const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

// Mock OpenAI module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAIClient);
});
