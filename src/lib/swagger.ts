/**
 * Swagger/OpenAPI Configuration
 *
 * Generates API documentation automatically from JSDoc comments
 */

import swaggerJSDoc from 'swagger-jsdoc'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'AI SaaS Platform API',
    version: '1.0.0',
    description: `
Production-grade AI Chat SaaS Platform API

## Features
- User authentication & authorization
- Multi-provider AI chat (OpenAI, Anthropic, Google)
- Conversation management
- Project organization
- Usage tracking & billing
- Provider metrics & monitoring
- Payment integration (PayOS)

## Authentication
Most endpoints require authentication via session cookies or JWT tokens.
    `,
    contact: {
      name: 'API Support',
      email: 'support@yourdomain.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          code: {
            type: 'string',
            description: 'Error code',
          },
          requestId: {
            type: 'string',
            description: 'Request ID for tracking',
          },
        },
      },
      CheckResult: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pass', 'fail', 'warn'],
          },
          message: {
            type: 'string',
          },
          responseTime: {
            type: 'number',
            description: 'Response time in milliseconds',
          },
          details: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          planTier: {
            type: 'string',
            enum: ['FREE', 'PLUS', 'PRO'],
          },
          monthlyTokenUsed: { type: 'number' },
          emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string', nullable: true },
          systemPrompt: { type: 'string', nullable: true },
          model: { type: 'string' },
          pinned: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          role: {
            type: 'string',
            enum: ['USER', 'ASSISTANT', 'SYSTEM'],
          },
          content: { type: 'string' },
          model: { type: 'string', nullable: true },
          promptTokens: { type: 'number', nullable: true },
          completionTokens: { type: 'number', nullable: true },
          latencyMs: { type: 'number', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ProviderHealth: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: ['OPENAI', 'ANTHROPIC', 'GOOGLE'],
          },
          status: {
            type: 'string',
            enum: ['healthy', 'degraded', 'down'],
          },
          errorRate: { type: 'number' },
          avgLatencyMs: { type: 'number' },
          recentErrorCount: { type: 'number' },
          lastChecked: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication endpoints',
    },
    {
      name: 'Chat',
      description: 'AI chat endpoints',
    },
    {
      name: 'Conversations',
      description: 'Conversation management',
    },
    {
      name: 'Projects',
      description: 'Project organization',
    },
    {
      name: 'Metrics',
      description: 'Provider metrics and monitoring',
    },
    {
      name: 'Payment',
      description: 'Payment and billing',
    },
    {
      name: 'Health',
      description: 'System health checks',
    },
  ],
}

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [
    './src/app/api/**/*.ts', // All API routes
    './src/controllers/**/*.ts', // Controllers
    './src/types/**/*.ts', // Type definitions
  ],
}

export const swaggerSpec = swaggerJSDoc(options)
