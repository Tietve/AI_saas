/**
 * Event Types for Analytics
 *
 * These events are published by microservices and consumed by Analytics Service
 */

export enum EventCategory {
  USER = 'user',
  CHAT = 'chat',
  BILLING = 'billing',
  PROVIDER = 'provider',
}

export enum UserEventType {
  SIGNUP = 'user.signup',
  SIGNIN = 'user.signin',
  SIGNOUT = 'user.signout',
  EMAIL_VERIFIED = 'user.email_verified',
  PASSWORD_RESET = 'user.password_reset',
  PLAN_UPGRADED = 'user.plan_upgraded',
  PLAN_DOWNGRADED = 'user.plan_downgraded',
}

export enum ChatEventType {
  MESSAGE_SENT = 'chat.message_sent',
  CONVERSATION_CREATED = 'chat.conversation_created',
  CONVERSATION_DELETED = 'chat.conversation_deleted',
  MESSAGE_FEEDBACK = 'chat.message_feedback',
}

export enum BillingEventType {
  PAYMENT_SUCCESS = 'billing.payment_success',
  PAYMENT_FAILED = 'billing.payment_failed',
  SUBSCRIPTION_CREATED = 'billing.subscription_created',
  SUBSCRIPTION_RENEWED = 'billing.subscription_renewed',
  SUBSCRIPTION_CANCELLED = 'billing.subscription_cancelled',
  PLAN_UPGRADED = 'billing.plan_upgraded',
  PLAN_DOWNGRADED = 'billing.plan_downgraded',
}

export type EventType = UserEventType | ChatEventType | BillingEventType;

/**
 * Base event structure
 */
export interface BaseEvent {
  event_id?: string;
  event_type: EventType;
  event_category: EventCategory;
  timestamp?: Date | string;
  service_name: string;

  // User info
  user_id: string;
  user_email?: string;
  plan_tier?: 'FREE' | 'PRO' | 'ENTERPRISE';

  // Request metadata
  ip_address?: string;
  user_agent?: string;
  country?: string;

  // Additional data
  metadata?: Record<string, any>;

  // Error tracking
  is_error?: boolean;
  error_message?: string;
}

/**
 * User event
 */
export interface UserEvent extends BaseEvent {
  event_category: EventCategory.USER;
  event_type: UserEventType;
}

/**
 * Chat event
 */
export interface ChatEvent extends BaseEvent {
  event_category: EventCategory.CHAT;
  event_type: ChatEventType;

  // Chat-specific fields
  conversation_id?: string;
  message_id?: string;
  ai_provider?: 'openai' | 'anthropic' | 'google' | 'groq' | 'xai';
  ai_model?: string;
  tokens_used?: number;
  response_time_ms?: number;
}

/**
 * Billing event
 */
export interface BillingEvent extends BaseEvent {
  event_category: EventCategory.BILLING;
  event_type: BillingEventType;

  // Billing-specific fields
  payment_id?: string;
  amount?: number;
  currency?: string;
  subscription_id?: string;
}

/**
 * Union type of all events
 */
export type AnalyticsEvent = UserEvent | ChatEvent | BillingEvent;

/**
 * Event for ClickHouse insertion (all fields optional to match schema)
 */
export interface ClickHouseEvent {
  event_id?: string;
  event_type: string;
  event_category: string;
  timestamp?: string;
  date?: string;

  // User
  user_id: string;
  user_email?: string;
  plan_tier?: string;

  // Service
  service_name: string;

  // Chat
  conversation_id?: string;
  message_id?: string;
  ai_provider?: string;
  ai_model?: string;
  tokens_used?: number;
  response_time_ms?: number;

  // Billing
  payment_id?: string;
  amount?: number;
  currency?: string;
  subscription_id?: string;

  // Request
  ip_address?: string;
  user_agent?: string;
  country?: string;

  // Metadata
  metadata?: string; // JSON string

  // Error
  is_error?: boolean;
  error_message?: string;
}

/**
 * Format date for ClickHouse DateTime
 * ClickHouse expects: YYYY-MM-DD HH:mm:ss
 */
function formatClickHouseDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, ''); // Remove milliseconds and Z
}

/**
 * Transform AnalyticsEvent to ClickHouseEvent
 */
export function toClickHouseEvent(event: AnalyticsEvent): ClickHouseEvent {
  const now = new Date();

  return {
    event_id: event.event_id || crypto.randomUUID(),
    event_type: event.event_type,
    event_category: event.event_category,
    timestamp: event.timestamp ? formatClickHouseDateTime(event.timestamp) : formatClickHouseDateTime(now),
    date: event.timestamp
      ? new Date(event.timestamp).toISOString().split('T')[0]
      : now.toISOString().split('T')[0],

    user_id: event.user_id,
    user_email: event.user_email || '',
    plan_tier: event.plan_tier || 'FREE',

    service_name: event.service_name,

    // Chat fields
    conversation_id: 'conversation_id' in event ? event.conversation_id || '' : '',
    message_id: 'message_id' in event ? event.message_id || '' : '',
    ai_provider: 'ai_provider' in event ? event.ai_provider || '' : '',
    ai_model: 'ai_model' in event ? event.ai_model || '' : '',
    tokens_used: 'tokens_used' in event ? event.tokens_used || 0 : 0,
    response_time_ms: 'response_time_ms' in event ? event.response_time_ms || 0 : 0,

    // Billing fields
    payment_id: 'payment_id' in event ? event.payment_id || '' : '',
    amount: 'amount' in event ? event.amount || 0 : 0,
    currency: 'currency' in event ? event.currency || 'VND' : 'VND',
    subscription_id: 'subscription_id' in event ? event.subscription_id || '' : '',

    // Request metadata
    ip_address: event.ip_address || '',
    user_agent: event.user_agent || '',
    country: event.country || '',

    // Metadata
    metadata: event.metadata ? JSON.stringify(event.metadata) : '{}',

    // Error
    is_error: event.is_error || false,
    error_message: event.error_message || '',
  };
}
