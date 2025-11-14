import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orchestrator Service API',
      version: '1.0.0',
      description: `
Enterprise Prompt Upgrader System - Orchestrator Service

This service provides AI-powered prompt upgrading with:
- **PII Redaction:** Automatic detection and redaction of sensitive information
- **Conversation Summarization:** Intelligent context compression using GPT-4o-mini
- **RAG Integration:** Vector search powered by Pinecone
- **Prompt Upgrading:** ROLE/TASK/CONTEXT/CONSTRAINTS/FORMAT structure generation
- **Multi-tenant Support:** Quota management and usage tracking
- **Canary Rollout:** A/B testing for prompt templates

## Authentication

Most endpoints require a \`userId\` in the request body or \`x-user-id\` header.

## Rate Limiting

- **FREE tier:** 1,000 upgrades/month, 100k tokens/month
- **Quota exceeded:** Returns HTTP 429 with reset time

## Cost

Average cost per request: ~$0.0003-0.0005 (depending on features enabled)
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Orchestrator',
        description: 'Prompt upgrading and orchestration',
      },
      {
        name: 'Templates',
        description: 'Prompt template management',
      },
      {
        name: 'Stats',
        description: 'Usage statistics and analytics',
      },
    ],
    components: {
      schemas: {
        Message: {
          type: 'object',
          required: ['role', 'content'],
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'assistant', 'system'],
              description: 'The role of the message sender',
            },
            content: {
              type: 'string',
              description: 'The message content',
            },
          },
        },
        OrchestrationOptions: {
          type: 'object',
          properties: {
            enableSummarization: {
              type: 'boolean',
              default: true,
              description: 'Enable conversation summarization',
            },
            enableRAG: {
              type: 'boolean',
              default: true,
              description: 'Enable RAG retrieval',
            },
            enablePIIRedaction: {
              type: 'boolean',
              default: true,
              description: 'Enable PII detection and redaction',
            },
            maxRagResults: {
              type: 'integer',
              minimum: 1,
              maximum: 20,
              description: 'Maximum number of RAG results to retrieve',
            },
            templateName: {
              type: 'string',
              description: 'Specific template name to use for upgrading',
            },
          },
        },
        UpgradePromptRequest: {
          type: 'object',
          required: ['userPrompt'],
          properties: {
            userPrompt: {
              type: 'string',
              minLength: 1,
              maxLength: 10000,
              description: 'The user prompt to upgrade',
              example: 'Write an email to apply for a job',
            },
            conversationHistory: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Message',
              },
              description: 'Optional conversation history for context',
            },
            userId: {
              type: 'string',
              description: 'User ID for quota tracking',
              example: 'user-123',
            },
            conversationId: {
              type: 'string',
              description: 'Conversation ID for caching',
            },
            options: {
              $ref: '#/components/schemas/OrchestrationOptions',
            },
          },
        },
        UpgradedPrompt: {
          type: 'object',
          properties: {
            finalPrompt: {
              type: 'string',
              description: 'The upgraded prompt in ROLE/TASK/CONTEXT/CONSTRAINTS/FORMAT structure',
            },
            reasoning: {
              type: 'string',
              description: 'Explanation of the upgrades made',
            },
            missingQuestions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Questions to gather more context',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence score of the upgrade',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Request validation failed',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                      code: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        QuotaExceeded: {
          description: 'Quota exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'QUOTA_EXCEEDED' },
                      message: { type: 'string' },
                      quotaInfo: {
                        type: 'object',
                        properties: {
                          used: { type: 'integer' },
                          limit: { type: 'integer' },
                          resetAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
