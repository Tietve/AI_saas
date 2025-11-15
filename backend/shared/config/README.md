# Shared Configuration Module

**Type-safe, validated configuration management for all microservices**

---

## Overview

This module provides a **standardized, type-safe configuration system** for all microservices in the MY-SAAS-CHAT project using Zod for runtime validation.

### Key Features

✅ **Consistent naming conventions** - All variables follow standard prefixes (CLOUDFLARE_*, OPENAI_*, etc.)
✅ **Runtime validation** - Zod schemas catch configuration errors on startup
✅ **Production security checks** - Automatic validation of secret strength
✅ **Helpful error messages** - Color-coded terminal output with troubleshooting tips
✅ **Composable schemas** - Services use only what they need
✅ **Type-safe** - Full TypeScript support with inferred types

---

## Quick Start

### 1. Import the module

```typescript
import {
  baseConfigSchema,
  postgresConfigSchema,
  redisConfigSchema,
  openaiConfigSchema,
  validateConfig
} from '@saas/shared/config';
```

### 2. Compose your service schema

```typescript
// Example: Auth service needs base + database + Redis + auth
const authServiceConfigSchema = baseConfigSchema
  .merge(postgresConfigSchema)
  .merge(redisConfigSchema)
  .merge(authConfigSchema);
```

### 3. Validate on startup

```typescript
export const config = validateConfig(authServiceConfigSchema, {
  serviceName: 'auth-service'
});

// config is now fully typed and validated!
// TypeScript knows all properties and their types
```

### 4. Use in your service

```typescript
import { config } from './config/env';

// Fully typed - autocomplete works!
const port = config.PORT;
const dbUrl = config.DATABASE_URL;
const jwtSecret = config.JWT_SECRET;
```

---

## Architecture

```
backend/shared/config/
├── schema.ts       # Zod schemas for all configuration categories
├── validator.ts    # Validation utilities and error formatting
├── index.ts        # Main exports
└── README.md       # This file
```

### Available Schemas

The module provides **25+ pre-built schemas** organized by category:

#### Base Configuration
- `baseConfigSchema` - NODE_ENV, LOG_LEVEL, PORT

#### Databases
- `postgresConfigSchema` - PostgreSQL connection and pool settings
- `mongoConfigSchema` - MongoDB connection and pool settings
- `redisConfigSchema` - Redis connection and timeout settings
- `clickhouseConfigSchema` - ClickHouse analytics database

#### AI Providers
- `openaiConfigSchema` - OpenAI API, models, tokens, temperature
- `anthropicConfigSchema` - Anthropic Claude API and models
- `googleAIConfigSchema` - Google AI (Gemini) configuration
- `groqConfigSchema` - Groq API for fast inference
- `cloudflareAIConfigSchema` - Cloudflare Workers AI

#### Vector Databases
- `pineconeConfigSchema` - Pinecone vector database (deprecated in orchestrator-service)

#### Payments
- `stripeConfigSchema` - Stripe API keys, webhook secret, price IDs

#### Messaging
- `rabbitmqConfigSchema` - RabbitMQ connection, exchange, queue, prefetch

#### Email
- `smtpConfigSchema` - SMTP server settings and credentials

#### Authentication
- `authConfigSchema` - JWT secrets, token expiry, security settings
- `googleOAuthConfigSchema` - Google OAuth client ID and secret
- `githubOAuthConfigSchema` - GitHub OAuth client ID and secret

#### Monitoring
- `sentryConfigSchema` - Sentry DSN, environment, sample rates
- `jaegerConfigSchema` - Jaeger tracing agent and sampler
- `prometheusConfigSchema` - Prometheus metrics endpoint

#### Cloud Storage
- `awsConfigSchema` - AWS credentials, region, S3 bucket
- `cloudflareR2ConfigSchema` - Cloudflare R2 storage

#### Quotas & Limits
- `rateLimitConfigSchema` - Rate limiting window and max requests
- `tokenQuotaConfigSchema` - Token quotas per tier
- `apiQuotaConfigSchema` - API usage quotas per tier

#### Performance
- `cacheTTLConfigSchema` - Cache TTL for different data types
- `performanceConfigSchema` - Context limits, RAG results, summary length

#### Other
- `fileUploadConfigSchema` - File size limits, allowed types
- `frontendConfigSchema` - Frontend URL, CORS settings
- `securityConfigSchema` - Helmet, CSP, HSTS settings
- `featureFlagsConfigSchema` - Feature toggles
- `maintenanceConfigSchema` - Maintenance mode settings

#### Complete Schema
- `completeConfigSchema` - All schemas merged (use for services that need everything)

---

## Naming Conventions

All environment variables follow **consistent prefixes**:

| Prefix | Category | Examples |
|--------|----------|----------|
| `CLOUDFLARE_*` | Cloudflare services | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` |
| `OPENAI_*` | OpenAI API | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| `ANTHROPIC_*` | Anthropic Claude | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |
| `GOOGLE_*` | Google AI/OAuth | `GOOGLE_AI_API_KEY`, `GOOGLE_CLIENT_ID` |
| `GROQ_*` | Groq API | `GROQ_API_KEY` |
| `DATABASE_*` | PostgreSQL | `DATABASE_URL`, `DATABASE_POOL_MAX` |
| `MONGODB_*` | MongoDB | `MONGODB_URL`, `MONGODB_DATABASE` |
| `REDIS_*` | Redis | `REDIS_URL`, `REDIS_PASSWORD` |
| `CLICKHOUSE_*` | ClickHouse | `CLICKHOUSE_HOST`, `CLICKHOUSE_DATABASE` |
| `PINECONE_*` | Pinecone | `PINECONE_API_KEY` (deprecated) |
| `AWS_*` | AWS services | `AWS_ACCESS_KEY_ID`, `AWS_S3_BUCKET` |
| `STRIPE_*` | Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `RABBITMQ_*` | RabbitMQ | `RABBITMQ_URL`, `RABBITMQ_EXCHANGE` |
| `SMTP_*` | Email/SMTP | `SMTP_HOST`, `SMTP_USER` |
| `SENTRY_*` | Sentry | `SENTRY_DSN`, `SENTRY_ENVIRONMENT` |
| `JAEGER_*` | Jaeger | `JAEGER_AGENT_HOST`, `JAEGER_SAMPLER_TYPE` |
| `PROMETHEUS_*` | Prometheus | `PROMETHEUS_ENABLED`, `PROMETHEUS_PORT` |

---

## Service Examples

### Auth Service

```typescript
import { z } from 'zod';
import {
  baseConfigSchema,
  postgresConfigSchema,
  redisConfigSchema,
  authConfigSchema,
  rabbitmqConfigSchema,
  sentryConfigSchema,
  validateConfig
} from '@saas/shared/config';

const authServiceConfigSchema = baseConfigSchema
  .merge(postgresConfigSchema)
  .merge(redisConfigSchema)
  .merge(authConfigSchema)
  .merge(rabbitmqConfigSchema)
  .merge(sentryConfigSchema.partial()); // Sentry is optional

export const config = validateConfig(authServiceConfigSchema, {
  serviceName: 'auth-service'
});

export type AuthServiceConfig = typeof config;
```

### Chat Service

```typescript
import {
  baseConfigSchema,
  postgresConfigSchema,
  openaiConfigSchema,
  googleAIConfigSchema,
  authConfigSchema,
  frontendConfigSchema,
  validateConfig
} from '@saas/shared/config';

const chatServiceConfigSchema = baseConfigSchema
  .merge(postgresConfigSchema)
  .merge(openaiConfigSchema)
  .merge(googleAIConfigSchema.partial()) // Google AI optional
  .merge(authConfigSchema.pick({ AUTH_SECRET: true })) // Only AUTH_SECRET
  .merge(frontendConfigSchema);

export const config = validateConfig(chatServiceConfigSchema, {
  serviceName: 'chat-service'
});
```

### Orchestrator Service

```typescript
import {
  baseConfigSchema,
  postgresConfigSchema,
  redisConfigSchema,
  openaiConfigSchema,
  cloudflareAIConfigSchema,
  cacheTTLConfigSchema,
  performanceConfigSchema,
  validateConfig
} from '@saas/shared/config';

const orchestratorConfigSchema = baseConfigSchema
  .merge(postgresConfigSchema)
  .merge(redisConfigSchema)
  .merge(openaiConfigSchema)
  .merge(cloudflareAIConfigSchema.partial())
  .merge(cacheTTLConfigSchema)
  .merge(performanceConfigSchema);

export const config = validateConfig(orchestratorConfigSchema, {
  serviceName: 'orchestrator-service'
});
```

---

## Validation Output

### Success

```bash
✅ Configuration validation successful
   Service: auth-service
```

### Failure

```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ❌ CONFIGURATION VALIDATION FAILED
  Service: auth-service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following environment variables are invalid or missing:

1. OPENAI_API_KEY
   Error: Required
   Code: invalid_type

2. DATABASE_URL
   Error: Expected string, received undefined
   Code: invalid_type

💡 Troubleshooting Tips:
1. Check your .env file exists and is in the correct location
2. Verify all required variables are set with valid values
3. Copy from .env.example if you haven't already:
   cp .env.example .env
4. Check the configuration documentation:
   docs/CONFIGURATION.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Production Security

The validator automatically checks for security issues in production:

- ✅ Secrets must be minimum 32 characters
- ✅ No default/example values allowed
- ✅ Strong secret generation recommended

```typescript
// Production validation error
CRITICAL SECURITY ERROR: AUTH_SECRET must be at least 32 characters in production.
Current length: 16.
Generate a strong secret with: openssl rand -base64 48
```

---

## Advanced Usage

### Custom Validation

Add custom validation to any schema:

```typescript
const customSchema = baseConfigSchema
  .merge(openaiConfigSchema)
  .refine(
    (data) => data.OPENAI_API_KEY.startsWith('sk-'),
    {
      message: 'OpenAI API key must start with sk-',
      path: ['OPENAI_API_KEY']
    }
  );
```

### Optional vs Required

Make entire schemas optional:

```typescript
const schema = baseConfigSchema
  .merge(sentryConfigSchema.partial()); // All Sentry vars optional
```

Pick specific fields:

```typescript
const schema = authConfigSchema.pick({
  AUTH_SECRET: true,
  JWT_SECRET: true
}); // Only these two required
```

### Safe Validation (No Throw)

Use `safeValidateConfig` for validation without throwing:

```typescript
import { safeValidateConfig } from '@saas/shared/config';

const result = safeValidateConfig(mySchema);

if (!result.success) {
  console.error('Validation failed:', result.errors);
} else {
  console.log('Config:', result.data);
}
```

### Create Service Validator

Create a reusable validator for your service:

```typescript
import { createConfigValidator } from '@saas/shared/config';

const validateAuthConfig = createConfigValidator(
  authServiceConfigSchema,
  'auth-service'
);

// Use it
export const config = validateAuthConfig();

// Or with custom options
export const config = validateAuthConfig({
  exitOnError: false,
  showWarnings: true
});
```

---

## Migration from Old Config

See detailed migration guide: [`docs/CONFIGURATION_MIGRATION.md`](/home/user/AI_saas/docs/CONFIGURATION_MIGRATION.md)

**Key changes:**
- `POSTGRES_*` → `DATABASE_URL` (full connection string)
- `GEMINI_API_KEY` → `GOOGLE_AI_API_KEY`
- `CLICKHOUSE_DB` → `CLICKHOUSE_DATABASE`
- `PINECONE_ENV` → `PINECONE_ENVIRONMENT` (deprecated in orchestrator)

---

## Documentation

- **Complete Reference:** [`docs/CONFIGURATION.md`](/home/user/AI_saas/docs/CONFIGURATION.md)
- **Migration Guide:** [`docs/CONFIGURATION_MIGRATION.md`](/home/user/AI_saas/docs/CONFIGURATION_MIGRATION.md)
- **Service Examples:** See each service's `.env.example` file

---

## TypeScript Support

All schemas export TypeScript types:

```typescript
import type {
  BaseConfig,
  PostgresConfig,
  RedisConfig,
  OpenAIConfig,
  CompleteConfig
} from '@saas/shared/config';

// Use in type annotations
function connectDatabase(config: PostgresConfig) {
  // config.DATABASE_URL is typed as string
  // config.DATABASE_POOL_MAX is typed as number
}
```

---

## Testing

Test configuration validation in your tests:

```typescript
import { safeValidateConfig, openaiConfigSchema } from '@saas/shared/config';

describe('Configuration', () => {
  it('should validate valid OpenAI config', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const result = safeValidateConfig(openaiConfigSchema);
    expect(result.success).toBe(true);
  });

  it('should fail without API key', () => {
    delete process.env.OPENAI_API_KEY;
    const result = safeValidateConfig(openaiConfigSchema);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});
```

---

## Best Practices

1. ✅ **Compose schemas** - Only include what your service needs
2. ✅ **Validate early** - Validate config on service startup
3. ✅ **Use types** - Export and use config types throughout your service
4. ✅ **Document requirements** - Update `.env.example` with all required variables
5. ✅ **Production secrets** - Use secret management (AWS Secrets Manager, Vault)
6. ✅ **Never commit .env** - Only commit `.env.example`
7. ✅ **Test validation** - Write tests for your config validation

---

## Contributing

When adding new configuration variables:

1. Add to appropriate schema in `schema.ts`
2. Update documentation in `docs/CONFIGURATION.md`
3. Update all relevant `.env.example` files
4. Update migration guide if breaking changes
5. Export type from schema
6. Test validation

---

## Support

For configuration issues:
- Check this README
- Review `docs/CONFIGURATION.md`
- Check service-specific `.env.example`
- Enable debug logging: `LOG_LEVEL=debug`
