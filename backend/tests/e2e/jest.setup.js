/**
 * Jest Setup File for E2E Tests
 *
 * This file runs before each test file and sets up:
 * 1. Environment variables for test mode
 * 2. Global mocks for external APIs (OpenAI, Stripe, etc.)
 * 3. Test timeouts and error handlers
 */

// ========================================
// 1. ENVIRONMENT SETUP
// ========================================

// Force test environment
process.env.NODE_ENV = 'test';

// Mock API keys to prevent real API calls
process.env.OPENAI_API_KEY = 'sk-test-mock-key';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-mock-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_key';
process.env.CLOUDFLARE_API_TOKEN = 'test-cloudflare-token';

// ========================================
// 2. GLOBAL MOCKS - EXTERNAL APIs
// ========================================

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: 'chatcmpl-test-123',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-4',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: '[MOCK AI Response] This is a mocked response from OpenAI for testing purposes.'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 50,
            completion_tokens: 50,
            total_tokens: 100
          }
        })
      }
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        object: 'list',
        data: [{
          object: 'embedding',
          index: 0,
          embedding: Array(1536).fill(0.1) // Mock 1536-dimension embedding
        }],
        model: 'text-embedding-ada-002',
        usage: {
          prompt_tokens: 10,
          total_tokens: 10
        }
      })
    }
  }));
});

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'cus_test_123',
        email: 'test@example.com',
        created: Date.now()
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cus_test_123',
        email: 'test@example.com'
      })
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        items: {
          data: [{
            id: 'si_test_123',
            price: { id: 'price_test_123' }
          }]
        }
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'sub_test_123',
        status: 'active'
      }),
      update: jest.fn().mockResolvedValue({
        id: 'sub_test_123',
        status: 'active'
      }),
      cancel: jest.fn().mockResolvedValue({
        id: 'sub_test_123',
        status: 'canceled'
      })
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test-session'
        })
      }
    },
    webhooks: {
      constructEvent: jest.fn().mockImplementation((payload, sig, secret) => {
        // Mock webhook event
        return {
          id: 'evt_test_123',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123',
              customer: 'cus_test_123',
              subscription: 'sub_test_123'
            }
          }
        };
      })
    }
  }));
});

// Mock Anthropic (Claude)
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        id: 'msg_test_123',
        type: 'message',
        role: 'assistant',
        content: [{
          type: 'text',
          text: '[MOCK Claude Response] This is a mocked response from Anthropic Claude for testing.'
        }],
        model: 'claude-3-sonnet-20240229',
        usage: {
          input_tokens: 50,
          output_tokens: 50
        }
      })
    }
  }));
});

// ========================================
// 3. TEST CONFIGURATION
// ========================================

// Increase timeout for E2E tests (30 seconds)
jest.setTimeout(30000);

// Console configuration
console.log('🧪 E2E Test Suite Initialized');
console.log('📝 Test Environment: Node.js');
console.log('🔧 Services: Auth (3001), Chat (3002), Billing (3003)');
console.log('🎭 Mocked APIs: OpenAI, Stripe, Anthropic');
console.log('💰 Estimated Cost: $0 (all APIs mocked)');
console.log('');

// ========================================
// 4. GLOBAL ERROR HANDLERS
// ========================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// ========================================
// 5. CLEANUP
// ========================================

// Reset mocks before each test
beforeEach(() => {
  // Mocks are already reset by Jest's default behavior
  // This is just a placeholder for future cleanup if needed
});

// Global cleanup after all tests
afterAll(() => {
  console.log('🧹 E2E Test Suite Cleanup Complete');
});
