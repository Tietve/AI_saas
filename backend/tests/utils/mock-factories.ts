/**
 * Mock Factories - External API Responses
 *
 * Factory functions for creating mock responses from external services
 * (OpenAI, Stripe, Cloudflare, etc.)
 */

import { randomBytes } from 'crypto';

/**
 * Mock OpenAI chat completion response
 */
export function mockOpenAIResponse(content: string, overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `chatcmpl-${randomBytes(16).toString('hex')}`,
    object: 'chat.completion',
    created: overrides.created || Math.floor(Date.now() / 1000),
    model: overrides.model || 'gpt-3.5-turbo',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: content
        },
        finish_reason: overrides.finish_reason || 'stop'
      }
    ],
    usage: {
      prompt_tokens: overrides.prompt_tokens || 10,
      completion_tokens: overrides.completion_tokens || 20,
      total_tokens: overrides.total_tokens || 30
    },
    ...overrides
  };
}

/**
 * Mock OpenAI streaming chunk
 */
export function mockOpenAIStreamChunk(content: string, overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `chatcmpl-${randomBytes(16).toString('hex')}`,
    object: 'chat.completion.chunk',
    created: overrides.created || Math.floor(Date.now() / 1000),
    model: overrides.model || 'gpt-3.5-turbo',
    choices: [
      {
        index: 0,
        delta: {
          content: content
        },
        finish_reason: overrides.finish_reason || null
      }
    ],
    ...overrides
  };
}

/**
 * Mock OpenAI embedding response
 */
export function mockEmbeddingResponse(dimensions = 1536, overrides: Partial<any> = {}) {
  return {
    object: 'list',
    data: [
      {
        object: 'embedding',
        embedding: overrides.embedding || Array(dimensions).fill(0).map(() => Math.random() * 0.01),
        index: 0
      }
    ],
    model: overrides.model || 'text-embedding-3-small',
    usage: {
      prompt_tokens: overrides.prompt_tokens || 10,
      total_tokens: overrides.total_tokens || 10
    },
    ...overrides
  };
}

/**
 * Mock embedding vector
 */
export function mockEmbeddingVector(dimensions = 1536): number[] {
  return Array(dimensions).fill(0).map(() => Math.random() * 0.01);
}

/**
 * Mock Cloudflare AI text generation response
 */
export function mockCloudflareTextResponse(content: string, overrides: Partial<any> = {}) {
  return {
    result: {
      response: content,
      ...overrides.result
    },
    success: overrides.success ?? true,
    errors: overrides.errors || [],
    messages: overrides.messages || [],
    ...overrides
  };
}

/**
 * Mock Cloudflare AI embedding response
 */
export function mockCloudflareEmbeddingResponse(dimensions = 768, overrides: Partial<any> = {}) {
  return {
    result: {
      shape: [1, dimensions],
      data: [mockEmbeddingVector(dimensions)],
      ...overrides.result
    },
    success: overrides.success ?? true,
    errors: overrides.errors || [],
    messages: overrides.messages || [],
    ...overrides
  };
}

/**
 * Mock Stripe customer object
 */
export function mockStripeCustomer(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `cus_${randomBytes(12).toString('hex')}`,
    object: 'customer',
    email: overrides.email || `test-${randomBytes(4).toString('hex')}@example.com`,
    name: overrides.name || 'Test Customer',
    created: overrides.created || Math.floor(Date.now() / 1000),
    currency: overrides.currency || 'usd',
    default_source: overrides.default_source || null,
    delinquent: overrides.delinquent ?? false,
    description: overrides.description || null,
    metadata: overrides.metadata || {},
    ...overrides
  };
}

/**
 * Mock Stripe subscription object
 */
export function mockStripeSubscription(overrides: Partial<any> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const periodEnd = now + (30 * 24 * 60 * 60); // 30 days from now

  return {
    id: overrides.id || `sub_${randomBytes(12).toString('hex')}`,
    object: 'subscription',
    customer: overrides.customer || `cus_${randomBytes(12).toString('hex')}`,
    status: overrides.status || 'active',
    created: overrides.created || now,
    current_period_start: overrides.current_period_start || now,
    current_period_end: overrides.current_period_end || periodEnd,
    cancel_at_period_end: overrides.cancel_at_period_end ?? false,
    canceled_at: overrides.canceled_at || null,
    trial_start: overrides.trial_start || null,
    trial_end: overrides.trial_end || null,
    items: {
      object: 'list',
      data: overrides.items || [
        {
          id: `si_${randomBytes(12).toString('hex')}`,
          object: 'subscription_item',
          price: {
            id: `price_${randomBytes(12).toString('hex')}`,
            object: 'price',
            active: true,
            currency: 'usd',
            unit_amount: 999,
            recurring: {
              interval: 'month',
              interval_count: 1
            }
          },
          quantity: 1
        }
      ]
    },
    metadata: overrides.metadata || {},
    ...overrides
  };
}

/**
 * Mock Stripe payment intent
 */
export function mockStripePaymentIntent(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `pi_${randomBytes(12).toString('hex')}`,
    object: 'payment_intent',
    amount: overrides.amount || 999,
    currency: overrides.currency || 'usd',
    status: overrides.status || 'succeeded',
    customer: overrides.customer || `cus_${randomBytes(12).toString('hex')}`,
    created: overrides.created || Math.floor(Date.now() / 1000),
    payment_method: overrides.payment_method || `pm_${randomBytes(12).toString('hex')}`,
    metadata: overrides.metadata || {},
    ...overrides
  };
}

/**
 * Mock Stripe checkout session
 */
export function mockStripeCheckoutSession(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `cs_${randomBytes(16).toString('hex')}`,
    object: 'checkout.session',
    cancel_url: overrides.cancel_url || 'https://example.com/cancel',
    success_url: overrides.success_url || 'https://example.com/success',
    customer: overrides.customer || `cus_${randomBytes(12).toString('hex')}`,
    mode: overrides.mode || 'subscription',
    status: overrides.status || 'complete',
    url: overrides.url || `https://checkout.stripe.com/pay/${randomBytes(16).toString('hex')}`,
    created: overrides.created || Math.floor(Date.now() / 1000),
    metadata: overrides.metadata || {},
    ...overrides
  };
}

/**
 * Mock Stripe webhook event
 */
export function mockStripeWebhookEvent(type: string, data: any, overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `evt_${randomBytes(12).toString('hex')}`,
    object: 'event',
    api_version: overrides.api_version || '2023-10-16',
    created: overrides.created || Math.floor(Date.now() / 1000),
    type: type,
    data: {
      object: data,
      previous_attributes: overrides.previous_attributes || {}
    },
    livemode: overrides.livemode ?? false,
    pending_webhooks: overrides.pending_webhooks || 1,
    request: overrides.request || {
      id: `req_${randomBytes(12).toString('hex')}`,
      idempotency_key: null
    },
    ...overrides
  };
}

/**
 * Mock Redis client
 */
export function mockRedisClient() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    mget: jest.fn(),
    mset: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn(),
    sadd: jest.fn(),
    smembers: jest.fn(),
    srem: jest.fn(),
    zadd: jest.fn(),
    zrange: jest.fn(),
    zrem: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    quit: jest.fn(),
    isOpen: true,
    isReady: true
  };
}

/**
 * Mock S3 client
 */
export function mockS3Client() {
  return {
    upload: jest.fn().mockResolvedValue({
      Location: `https://s3.amazonaws.com/test-bucket/test-key`,
      Key: 'test-key',
      Bucket: 'test-bucket',
      ETag: '"abc123"'
    }),
    getObject: jest.fn().mockResolvedValue({
      Body: Buffer.from('test content'),
      ContentType: 'application/pdf',
      ContentLength: 1024
    }),
    deleteObject: jest.fn().mockResolvedValue({}),
    headObject: jest.fn().mockResolvedValue({
      ContentLength: 1024,
      ContentType: 'application/pdf',
      LastModified: new Date()
    }),
    listObjects: jest.fn().mockResolvedValue({
      Contents: []
    })
  };
}

/**
 * Mock JWT token
 */
export function mockJWTToken(payload: any = {}, expiresIn = '15m') {
  return {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`,
    payload: {
      sub: payload.sub || `user-${randomBytes(8).toString('hex')}`,
      email: payload.email || `test@example.com`,
      planTier: payload.planTier || 'FREE',
      iat: payload.iat || Math.floor(Date.now() / 1000),
      exp: payload.exp || Math.floor(Date.now() / 1000) + (expiresIn === '15m' ? 900 : 604800),
      ...payload
    }
  };
}

/**
 * Mock Socket.IO socket
 */
export function mockSocket() {
  return {
    id: randomBytes(8).toString('hex'),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    handshake: {
      auth: {},
      headers: {},
      query: {}
    },
    data: {}
  };
}

/**
 * Mock Socket.IO server
 */
export function mockSocketServer() {
  return {
    emit: jest.fn(),
    on: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    sockets: {
      emit: jest.fn(),
      sockets: new Map()
    },
    use: jest.fn(),
    of: jest.fn().mockReturnThis()
  };
}

/**
 * Mock HTTP response for fetch/axios
 */
export function mockHTTPResponse(data: any, overrides: Partial<any> = {}) {
  return {
    data: data,
    status: overrides.status || 200,
    statusText: overrides.statusText || 'OK',
    headers: overrides.headers || {},
    config: overrides.config || {},
    ...overrides
  };
}

/**
 * Mock file upload (multipart/form-data)
 */
export function mockFileUpload(overrides: Partial<any> = {}) {
  return {
    fieldname: overrides.fieldname || 'file',
    originalname: overrides.originalname || 'test-document.pdf',
    encoding: overrides.encoding || '7bit',
    mimetype: overrides.mimetype || 'application/pdf',
    size: overrides.size || 1024 * 100, // 100KB
    buffer: overrides.buffer || Buffer.from('mock file content'),
    destination: overrides.destination || '/tmp',
    filename: overrides.filename || `${randomBytes(16).toString('hex')}.pdf`,
    path: overrides.path || `/tmp/${randomBytes(16).toString('hex')}.pdf`,
    ...overrides
  };
}

/**
 * Mock PDF parsing result
 */
export function mockPDFParseResult(overrides: Partial<any> = {}) {
  return {
    numpages: overrides.numpages || 5,
    numrender: overrides.numrender || 5,
    info: {
      Title: overrides.title || 'Test Document',
      Author: overrides.author || 'Test Author',
      Subject: overrides.subject || '',
      Creator: overrides.creator || 'Test Creator',
      Producer: overrides.producer || 'Test Producer',
      CreationDate: overrides.creationDate || new Date().toISOString(),
      ModDate: overrides.modDate || new Date().toISOString(),
      ...overrides.info
    },
    metadata: overrides.metadata || null,
    text: overrides.text || 'This is sample text content extracted from a PDF document.',
    version: overrides.version || '1.10.100',
    ...overrides
  };
}

/**
 * Mock environment variables
 */
export function mockEnvVars(envVars: Record<string, string>) {
  const originalEnv = { ...process.env };

  Object.keys(envVars).forEach((key) => {
    process.env[key] = envVars[key];
  });

  return {
    restore: () => {
      Object.keys(envVars).forEach((key) => {
        if (originalEnv[key] !== undefined) {
          process.env[key] = originalEnv[key];
        } else {
          delete process.env[key];
        }
      });
    }
  };
}
