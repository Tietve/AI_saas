/**
 * Shared Configuration Module
 *
 * Exports all configuration schemas, validators, and utilities.
 *
 * @example Basic usage in a service
 * ```typescript
 * import { z } from 'zod';
 * import {
 *   baseConfigSchema,
 *   postgresConfigSchema,
 *   redisConfigSchema,
 *   openaiConfigSchema,
 *   validateConfig
 * } from '@saas/shared/config';
 *
 * // Compose only the schemas your service needs
 * const serviceConfigSchema = baseConfigSchema
 *   .merge(postgresConfigSchema)
 *   .merge(redisConfigSchema)
 *   .merge(openaiConfigSchema.partial()); // Make OpenAI optional
 *
 * // Validate on startup
 * export const config = validateConfig(serviceConfigSchema, {
 *   serviceName: 'auth-service'
 * });
 * ```
 *
 * @example Using complete schema
 * ```typescript
 * import { completeConfigSchema, validateConfig } from '@saas/shared/config';
 *
 * export const config = validateConfig(completeConfigSchema, {
 *   serviceName: 'orchestrator-service'
 * });
 * ```
 *
 * @module shared/config
 */

// Export all schemas
export * from './schema';

// Export validators
export * from './validator';

// Export Sentry configuration
export * from './sentry';

// Re-export commonly used utilities
export { z } from 'zod';
