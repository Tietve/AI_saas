/**
 * Performance configuration for the application
 */

export const PerformanceConfig = {
  // Database connection pool settings
  DATABASE_POOL: {
    MIN_CONNECTIONS: 2,
    MAX_CONNECTIONS: 10,
    ACQUIRE_TIMEOUT: 30000,
    CREATE_TIMEOUT: 30000,
    DESTROY_TIMEOUT: 5000,
    IDLE_TIMEOUT: 30000,
  },

  // Cache settings
  CACHE: {
    DEFAULT_TTL: 300, // 5 minutes
    USER_DATA_TTL: 600, // 10 minutes
    USAGE_DATA_TTL: 60, // 1 minute
    CONVERSATION_TTL: 300, // 5 minutes
    PROVIDER_HEALTH_TTL: 30, // 30 seconds
  },

  // Rate limiting settings (keeping daily limit at 20 for free users)
  RATE_LIMITS: {
    CHAT_SEND: {
      limit: 60, // requests per minute
      windowMs: 60_000, // 1 minute
      burst: 30, // burst allowance
    },
    IMAGE_GENERATION: {
      limit: 20, // requests per minute
      windowMs: 60_000,
      burst: 10,
    },
    INTENT_CLASSIFY: {
      limit: 200, // requests per minute
      windowMs: 60_000,
      burst: 100,
    },
    DAILY_FREE_MESSAGES: 20, // Keep this at 20 as requested
  },

  // Performance monitoring thresholds
  MONITORING: {
    SLOW_OPERATION_THRESHOLD: 1000, // 1 second
    SLOW_QUERY_THRESHOLD: 500, // 500ms
    SLOW_API_THRESHOLD: 2000, // 2 seconds
    MAX_METRICS_STORED: 1000,
  },

  // Feature flags
  FEATURES: {
    ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    ENABLE_QUERY_CACHING: process.env.ENABLE_QUERY_CACHING !== 'false', // Default enabled
    ENABLE_DATABASE_POOLING: process.env.ENABLE_DATABASE_POOLING !== 'false', // Default enabled
    ENABLE_REDIS_CACHING: process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  },

  // Environment-specific settings
  ENVIRONMENT: {
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_TEST: process.env.NODE_ENV === 'test',
  },
} as const

// Helper functions
export const isFeatureEnabled = (feature: keyof typeof PerformanceConfig.FEATURES): boolean => {
  return PerformanceConfig.FEATURES[feature]
}

export const getCacheTTL = (type: keyof typeof PerformanceConfig.CACHE): number => {
  return PerformanceConfig.CACHE[type]
}

export const getRateLimit = (endpoint: keyof typeof PerformanceConfig.RATE_LIMITS) => {
  return PerformanceConfig.RATE_LIMITS[endpoint]
}

// Validation
export const validatePerformanceConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Validate database pool settings
  if (PerformanceConfig.DATABASE_POOL.MIN_CONNECTIONS > PerformanceConfig.DATABASE_POOL.MAX_CONNECTIONS) {
    errors.push('MIN_CONNECTIONS cannot be greater than MAX_CONNECTIONS')
  }

  // Validate rate limits
  Object.entries(PerformanceConfig.RATE_LIMITS).forEach(([key, config]) => {
    if (typeof config === 'object' && 'limit' in config) {
      if (config.limit <= 0) {
        errors.push(`Rate limit for ${key} must be positive`)
      }
      if (config.windowMs <= 0) {
        errors.push(`Window time for ${key} must be positive`)
      }
    }
  })

  // Validate cache TTLs
  Object.entries(PerformanceConfig.CACHE).forEach(([key, ttl]) => {
    if (ttl <= 0) {
      errors.push(`Cache TTL for ${key} must be positive`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

// Log configuration on startup
if (PerformanceConfig.ENVIRONMENT.IS_DEVELOPMENT) {
  console.log('[Performance Config] Loaded with settings:', {
    databasePool: PerformanceConfig.DATABASE_POOL,
    rateLimits: PerformanceConfig.RATE_LIMITS,
    cacheTTL: PerformanceConfig.CACHE,
    features: PerformanceConfig.FEATURES,
  })

  const validation = validatePerformanceConfig()
  if (!validation.valid) {
    console.error('[Performance Config] Validation errors:', validation.errors)
  }
}
