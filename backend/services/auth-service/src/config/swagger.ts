/**
 * Swagger/OpenAPI Configuration
 * Provides interactive API documentation
 */

// @ts-ignore - swagger-jsdoc doesn't have type definitions
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: any = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: 'Authentication and user management service for SaaS Chat platform',
      contact: {
        name: 'API Support',
        email: 'support@saaschat.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'http://localhost:4000',
        description: 'API Gateway',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sessionId',
          description: 'Session cookie for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            emailVerified: {
              type: 'boolean',
              description: 'Whether email is verified',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message',
                },
                stack: {
                  type: 'string',
                  description: 'Stack trace (development only)',
                },
              },
            },
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
        name: 'User Management',
        description: 'User profile and account management',
      },
      {
        name: 'Health',
        description: 'Service health and metrics',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger documentation
 */
export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Auth Service API Documentation',
    })
  );

  // OpenAPI JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('✅ Swagger documentation available at /api-docs');
}

export { swaggerSpec };
