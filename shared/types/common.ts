/**
 * Common types used across all microservices
 */

export enum PlanTier {
  FREE = 'FREE',
  PLUS = 'PLUS',
  PRO = 'PRO'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum Role {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM'
}

export enum AIProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  GOOGLE = 'GOOGLE',
  GROQ = 'GROQ'
}

export enum ModelId {
  // OpenAI
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4O = 'gpt-4o',

  // Anthropic
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',

  // Google
  GEMINI_PRO = 'gemini-pro',
  GEMINI_PRO_VISION = 'gemini-pro-vision'
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  planTier: PlanTier;
  monthlyTokenUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  model: ModelId;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  systemPrompt: string | null;
  model: ModelId;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QuotaCheckResult {
  ok: boolean;
  reason?: 'OVER_LIMIT' | 'PER_REQUEST_TOO_LARGE' | 'DAILY_LIMIT';
  remaining: number;
  limit: number;
  wouldExceedBy?: number;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database?: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
    redis?: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
    queue?: {
      status: 'up' | 'down';
      pendingJobs?: number;
      error?: string;
    };
  };
  uptime: number;
  timestamp: string;
  version?: string;
}
