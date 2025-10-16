-- Performance Optimization Migration
-- This migration adds indexes to improve query performance

-- Add index on User.email for faster lookups (in addition to emailLower)
-- emailLower already has @unique which creates an index
-- But we add a regular index on email for case-sensitive searches
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Add composite index for Subscription queries (common pattern: userId + status)
-- Already exists in schema but ensuring it's created
CREATE INDEX IF NOT EXISTS "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- Add index on Payment.userId for faster user payment lookups
-- Already exists in schema but ensuring it's created
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");

-- Add index on TokenUsage for date range queries
-- Already exists in schema but ensuring it's created
CREATE INDEX IF NOT EXISTS "TokenUsage_userId_createdAt_asc_idx" ON "TokenUsage"("userId", "createdAt" ASC);
CREATE INDEX IF NOT EXISTS "TokenUsage_userId_createdAt_desc_idx" ON "TokenUsage"("userId", "createdAt" DESC);

-- Add partial index for active subscriptions (most queried)
CREATE INDEX IF NOT EXISTS "Subscription_active_idx" ON "Subscription"("userId", "currentPeriodEnd")
WHERE "status" = 'ACTIVE';

-- Add index on Message for conversation timeline queries
-- Already exists in schema but ensuring it's created
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_asc_idx" ON "Message"("conversationId", "createdAt" ASC);
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_desc_idx" ON "Message"("conversationId", "createdAt" DESC);

-- Analyze tables to update statistics for query planner
ANALYZE "User";
ANALYZE "Subscription";
ANALYZE "Payment";
ANALYZE "TokenUsage";
ANALYZE "Message";
ANALYZE "Conversation";
