-- Phase 2 Performance Optimization: Critical Database Indexes
-- This migration adds indexes for frequently queried fields to improve performance

-- 1. User table indexes for plan and usage queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_plan_tier" ON "User"("planTier");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_monthly_token_used" ON "User"("monthlyTokenUsed");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_created_at" ON "User"("createdAt");

-- 2. Message table indexes for conversation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_conversation_created_desc" ON "Message"("conversationId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_role_conversation" ON "Message"("role", "conversationId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_model" ON "Message"("model");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_created_at" ON "Message"("createdAt");

-- 3. Conversation table indexes for user queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_conversation_user_created_desc" ON "Conversation"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_conversation_model" ON "Conversation"("model");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_conversation_bot_id" ON "Conversation"("botId");

-- 4. TokenUsage table indexes for analytics and billing
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_token_usage_user_model" ON "TokenUsage"("userId", "model");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_token_usage_created_at_desc" ON "TokenUsage"("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_token_usage_model_created" ON "TokenUsage"("model", "createdAt");

-- 5. DailyUsageRecord indexes for daily limit checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_daily_usage_user_date_desc" ON "DailyUsageRecord"("userId", "date" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_daily_usage_date" ON "DailyUsageRecord"("date");

-- 6. Payment and subscription indexes for billing queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payment_user_status" ON "Payment"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payment_created_at" ON "Payment"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_subscription_user_status" ON "Subscription"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_subscription_period_end" ON "Subscription"("currentPeriodEnd");

-- 7. Attachment indexes for file queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_attachment_kind" ON "Attachment"("kind");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_attachment_conversation_message" ON "Attachment"("conversationId", "messageId");

-- 8. WebhookEvent indexes for processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_webhook_status_attempts" ON "WebhookEvent"("status", "attempts");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_webhook_created_at" ON "WebhookEvent"("createdAt");

-- 9. Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_plan_token_used" ON "User"("planTier", "monthlyTokenUsed");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_conversation_user_updated_desc" ON "Conversation"("userId", "updatedAt" DESC);

-- 10. Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_active_subscriptions" ON "Subscription"("userId", "currentPeriodEnd") 
WHERE "status" = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_recent_messages" ON "Message"("conversationId", "createdAt" DESC) 
WHERE "createdAt" > NOW() - INTERVAL '30 days';

-- 11. Indexes for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_token_usage_monthly" ON "TokenUsage"("userId", "createdAt") 
WHERE "createdAt" > NOW() - INTERVAL '1 month';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_daily_usage_recent" ON "DailyUsageRecord"("userId", "date" DESC) 
WHERE "date" > CURRENT_DATE - INTERVAL '7 days';
