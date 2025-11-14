/**
 * Shared Event Types for Analytics
 * Used by all services to publish events to Analytics Service
 */

export enum EventCategory {
  USER = 'user',
  CHAT = 'chat',
  BILLING = 'billing',
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
