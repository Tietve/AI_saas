/**
 * Configuration Validator
 *
 * Provides startup validation for environment variables with clear error messages.
 * Validates configuration on service startup and provides helpful debugging information.
 *
 * @module shared/config/validator
 */

import { z, ZodError, ZodSchema } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Configuration validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Service name for better error messages
   */
  serviceName?: string;

  /**
   * Whether to exit process on validation failure
   * @default true
   */
  exitOnError?: boolean;

  /**
   * Whether to show warnings for missing optional variables
   * @default true in development
   */
  showWarnings?: boolean;

  /**
   * Custom .env file path
   */
  envFilePath?: string;

  /**
   * Whether to load .env file automatically
   * @default true
   */
  loadEnvFile?: boolean;
}

/**
 * Format Zod error for display
 */
function formatZodError(error: ZodError): Array<{ path: string; message: string; code: string }> {
  return error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Print formatted error message
 */
function printError(
  errors: Array<{ path: string; message: string; code: string }>,
  serviceName?: string
): void {
  console.error(`\n${colors.red}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.error(`${colors.red}${colors.bright}  ❌ CONFIGURATION VALIDATION FAILED${colors.reset}`);
  if (serviceName) {
    console.error(`${colors.red}${colors.bright}  Service: ${serviceName}${colors.reset}`);
  }
  console.error(`${colors.red}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.error(`${colors.yellow}The following environment variables are invalid or missing:\n${colors.reset}`);

  errors.forEach((error, index) => {
    console.error(`${colors.bright}${index + 1}.${colors.reset} ${colors.cyan}${error.path || 'UNKNOWN'}${colors.reset}`);
    console.error(`   ${colors.red}Error:${colors.reset} ${error.message}`);
    console.error(`   ${colors.yellow}Code:${colors.reset} ${error.code}\n`);
  });

  console.error(`${colors.magenta}${colors.bright}💡 Troubleshooting Tips:${colors.reset}`);
  console.error(`${colors.magenta}1.${colors.reset} Check your .env file exists and is in the correct location`);
  console.error(`${colors.magenta}2.${colors.reset} Verify all required variables are set with valid values`);
  console.error(`${colors.magenta}3.${colors.reset} Copy from .env.example if you haven't already:`);
  console.error(`   ${colors.cyan}cp .env.example .env${colors.reset}`);
  console.error(`${colors.magenta}4.${colors.reset} Check the configuration documentation:`);
  console.error(`   ${colors.cyan}docs/CONFIGURATION.md${colors.reset}\n`);

  console.error(`${colors.red}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

/**
 * Print success message
 */
function printSuccess(serviceName?: string): void {
  console.log(`${colors.green}${colors.bright}✅ Configuration validation successful${colors.reset}`);
  if (serviceName) {
    console.log(`${colors.green}   Service: ${serviceName}${colors.reset}`);
  }
}

/**
 * Print warning about missing optional variables
 */
function printWarnings(missingOptional: string[]): void {
  if (missingOptional.length === 0) return;

  console.warn(`\n${colors.yellow}${colors.bright}⚠️  Optional Environment Variables Not Set:${colors.reset}`);
  missingOptional.forEach((varName) => {
    console.warn(`${colors.yellow}   - ${varName}${colors.reset}`);
  });
  console.warn(`${colors.yellow}   These variables will use default values.${colors.reset}\n`);
}

/**
 * Check if .env file exists and provide helpful message
 */
function checkEnvFile(envFilePath?: string): void {
  const defaultPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '..', '.env'),
  ];

  const pathsToCheck = envFilePath ? [envFilePath, ...defaultPaths] : defaultPaths;

  for (const envPath of pathsToCheck) {
    if (fs.existsSync(envPath)) {
      console.log(`${colors.blue}📄 Loaded environment from: ${envPath}${colors.reset}`);
      return;
    }
  }

  console.warn(`${colors.yellow}${colors.bright}⚠️  No .env file found${colors.reset}`);
  console.warn(`${colors.yellow}   Checked paths:${colors.reset}`);
  pathsToCheck.forEach((p) => console.warn(`${colors.yellow}   - ${p}${colors.reset}`));
  console.warn(`${colors.yellow}   Using environment variables from system/shell${colors.reset}\n`);
}

/**
 * Validate production secrets
 */
function validateProductionSecrets(data: any): Array<{ path: string; message: string; code: string }> {
  const errors: Array<{ path: string; message: string; code: string }> = [];

  if (data.NODE_ENV !== 'production') {
    return errors;
  }

  // Check AUTH_SECRET
  if (data.AUTH_SECRET && data.AUTH_SECRET.length < 32) {
    errors.push({
      path: 'AUTH_SECRET',
      message: `Secret must be at least 32 characters in production (current: ${data.AUTH_SECRET.length}). Generate with: openssl rand -base64 48`,
      code: 'WEAK_SECRET',
    });
  }

  // Check JWT_SECRET
  if (data.JWT_SECRET && data.JWT_SECRET.length < 32) {
    errors.push({
      path: 'JWT_SECRET',
      message: `Secret must be at least 32 characters in production (current: ${data.JWT_SECRET.length}). Generate with: openssl rand -base64 48`,
      code: 'WEAK_SECRET',
    });
  }

  // Check REFRESH_TOKEN_SECRET
  if (data.REFRESH_TOKEN_SECRET && data.REFRESH_TOKEN_SECRET.length < 32) {
    errors.push({
      path: 'REFRESH_TOKEN_SECRET',
      message: `Secret must be at least 32 characters in production (current: ${data.REFRESH_TOKEN_SECRET.length}). Generate with: openssl rand -base64 48`,
      code: 'WEAK_SECRET',
    });
  }

  // Warn about default values
  const dangerousDefaults = [
    'your-256-bit-secret-key-here-change-this-in-production',
    'your-jwt-secret-key-here-change-this-in-production',
    'your-refresh-token-secret-here-change-this',
    'change-this-in-production',
  ];

  for (const key of ['AUTH_SECRET', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET']) {
    if (data[key] && dangerousDefaults.some((def) => data[key].includes(def))) {
      errors.push({
        path: key,
        message: 'Using example/default secret in production! Generate a strong secret immediately.',
        code: 'DEFAULT_SECRET',
      });
    }
  }

  return errors;
}

/**
 * Load environment file if requested
 */
function loadEnvFile(envFilePath?: string): void {
  try {
    // Use dotenv to load .env file
    const dotenv = require('dotenv');
    const result = envFilePath
      ? dotenv.config({ path: envFilePath })
      : dotenv.config();

    if (result.error && envFilePath) {
      console.warn(`${colors.yellow}⚠️  Could not load .env file from: ${envFilePath}${colors.reset}`);
    }
  } catch (error) {
    // dotenv not available, skip
  }
}

/**
 * Validate configuration against schema
 *
 * @param schema - Zod schema to validate against
 * @param options - Validation options
 * @returns Validated configuration data
 * @throws Error if validation fails and exitOnError is false
 */
export function validateConfig<T extends ZodSchema>(
  schema: T,
  options: ValidationOptions = {}
): z.infer<T> {
  const {
    serviceName,
    exitOnError = true,
    showWarnings = process.env.NODE_ENV === 'development',
    envFilePath,
    loadEnvFile: shouldLoadEnvFile = true,
  } = options;

  // Load .env file if requested
  if (shouldLoadEnvFile) {
    loadEnvFile(envFilePath);
  }

  // Check if .env file exists
  checkEnvFile(envFilePath);

  try {
    // Parse environment variables
    const result = schema.safeParse(process.env);

    if (!result.success) {
      const formattedErrors = formatZodError(result.error);
      printError(formattedErrors, serviceName);

      if (exitOnError) {
        process.exit(1);
      } else {
        throw new Error('Configuration validation failed');
      }
    }

    // Validate production secrets
    const secretErrors = validateProductionSecrets(result.data);
    if (secretErrors.length > 0) {
      printError(secretErrors, serviceName);
      if (exitOnError) {
        process.exit(1);
      } else {
        throw new Error('Production security validation failed');
      }
    }

    // Print success message
    printSuccess(serviceName);

    // Show warnings for missing optional variables if requested
    if (showWarnings) {
      const missingOptional: string[] = [];
      // Note: This is a simplified check, could be enhanced with schema introspection
      printWarnings(missingOptional);
    }

    return result.data;
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = formatZodError(error);
      printError(formattedErrors, serviceName);

      if (exitOnError) {
        process.exit(1);
      }
    }
    throw error;
  }
}

/**
 * Validate configuration without throwing errors
 * Returns a result object instead
 *
 * @param schema - Zod schema to validate against
 * @returns Validation result
 */
export function safeValidateConfig<T extends ZodSchema>(
  schema: T
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(process.env);

  if (!result.success) {
    return {
      success: false,
      errors: formatZodError(result.error),
    };
  }

  // Check production secrets
  const secretErrors = validateProductionSecrets(result.data);
  if (secretErrors.length > 0) {
    return {
      success: false,
      errors: secretErrors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Create a service-specific config validator
 *
 * @param schema - Zod schema for the service
 * @param serviceName - Name of the service
 * @returns Function to validate config on startup
 */
export function createConfigValidator<T extends ZodSchema>(
  schema: T,
  serviceName: string
) {
  return (options: Partial<ValidationOptions> = {}) => {
    return validateConfig(schema, {
      ...options,
      serviceName,
    });
  };
}

/**
 * Generate environment variable template from schema
 * Useful for creating .env.example files
 *
 * @param schema - Zod schema
 * @returns Template string for .env file
 */
export function generateEnvTemplate(schema: ZodSchema): string {
  // This is a simplified implementation
  // A full implementation would introspect the schema and generate comments
  const lines: string[] = [
    '# Generated Environment Variables Template',
    '# Copy this to .env and fill in your values',
    '',
  ];

  // Note: Full implementation would require schema introspection
  // which is complex with Zod. Consider using a separate tool for this.

  return lines.join('\n');
}
