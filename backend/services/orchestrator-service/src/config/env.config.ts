import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvConfig {
  // Server
  port: number;
  nodeEnv: string;

  // Database
  databaseUrl: string;

  // Redis
  redisUrl: string;
  redisPassword?: string;
  redisDb: number;

  // Pinecone
  pinecone: {
    apiKey: string;
    environment: string;
    indexName: string;
  };

  // OpenAI
  openai: {
    apiKey: string;
    orgId?: string;
  };

  // AI Models
  models: {
    embedding: string;
    summarizer: string;
    upgrader: string;
    mainLlm: string;
  };

  // Cache TTL
  cache: {
    summaryTtl: number;
    embeddingTtl: number;
    ragTtl: number;
  };

  // Performance
  performance: {
    maxContextMessages: number;
    maxRagResults: number;
    maxSummaryLength: number;
  };

  // Quotas
  quotas: {
    freeMonthlyTokens: number;
    freeMonthlyUpgrades: number;
    freeMonthlyEmbeddings: number;
  };

  // Monitoring
  sentry: {
    dsn?: string;
    environment: string;
    tracesSampleRate: number;
  };

  // Logging
  logLevel: string;
}

// Validate required environment variables
const required = [
  'DATABASE_URL',
  'REDIS_URL',
  'PINECONE_API_KEY',
  'PINECONE_ENVIRONMENT',
  'PINECONE_INDEX_NAME',
  'OPENAI_API_KEY',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env: EnvConfig = {
  // Server
  port: parseInt(process.env.PORT || '3006', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Redis
  redisUrl: process.env.REDIS_URL!,
  redisPassword: process.env.REDIS_PASSWORD,
  redisDb: parseInt(process.env.REDIS_DB || '0', 10),

  // Pinecone
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
    indexName: process.env.PINECONE_INDEX_NAME!,
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    orgId: process.env.OPENAI_ORG_ID,
  },

  // AI Models
  models: {
    embedding: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    summarizer: process.env.SUMMARIZER_MODEL || 'gpt-4o-mini',
    upgrader: process.env.UPGRADER_MODEL || 'gpt-4o-mini',
    mainLlm: process.env.MAIN_LLM_MODEL || 'gpt-4',
  },

  // Cache TTL (convert to seconds)
  cache: {
    summaryTtl: parseInt(process.env.SUMMARY_CACHE_TTL || '604800', 10),
    embeddingTtl: parseInt(process.env.EMBEDDING_CACHE_TTL || '2592000', 10),
    ragTtl: parseInt(process.env.RAG_CACHE_TTL || '3600', 10),
  },

  // Performance
  performance: {
    maxContextMessages: parseInt(process.env.MAX_CONTEXT_MESSAGES || '10', 10),
    maxRagResults: parseInt(process.env.MAX_RAG_RESULTS || '5', 10),
    maxSummaryLength: parseInt(process.env.MAX_SUMMARY_LENGTH || '500', 10),
  },

  // Quotas
  quotas: {
    freeMonthlyTokens: parseInt(process.env.FREE_MONTHLY_TOKEN_QUOTA || '100000', 10),
    freeMonthlyUpgrades: parseInt(process.env.FREE_MONTHLY_UPGRADE_QUOTA || '1000', 10),
    freeMonthlyEmbeddings: parseInt(process.env.FREE_MONTHLY_EMBEDDING_QUOTA || '10000', 10),
  },

  // Monitoring
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};
