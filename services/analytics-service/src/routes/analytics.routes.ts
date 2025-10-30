/**
 * Analytics Routes
 * REST API routes for analytics service
 */

import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

// ==================== USER ANALYTICS ====================

/**
 * GET /api/analytics/users/count
 * Get total user count by plan tier
 */
router.get('/users/count', analyticsController.getUserCount);

/**
 * GET /api/analytics/users/growth
 * Get user growth over time
 * Query params: startDate, endDate (YYYY-MM-DD)
 */
router.get('/users/growth', analyticsController.getUserGrowth);

/**
 * GET /api/analytics/users/active
 * Get active users (DAU/WAU/MAU)
 * Query params: period (day|week|month, default: day)
 */
router.get('/users/active', analyticsController.getActiveUsers);

/**
 * GET /api/analytics/users/signups
 * Get user signups over time
 * Query params: startDate, endDate (YYYY-MM-DD)
 */
router.get('/users/signups', analyticsController.getUserSignups);

/**
 * GET /api/analytics/users/retention
 * Get user retention rate by cohort
 * Query params: cohortDate (YYYY-MM-DD)
 */
router.get('/users/retention', analyticsController.getUserRetention);

/**
 * GET /api/analytics/users/top
 * Get top users by activity
 * Query params: limit (number, default: 10)
 */
router.get('/users/top', analyticsController.getTopUsers);

// ==================== CHAT ANALYTICS ====================

/**
 * GET /api/analytics/chat/messages
 * Get total message count
 */
router.get('/chat/messages', analyticsController.getTotalMessages);

/**
 * GET /api/analytics/chat/by-provider
 * Get messages grouped by AI provider
 */
router.get('/chat/by-provider', analyticsController.getMessagesByProvider);

/**
 * GET /api/analytics/chat/by-model
 * Get messages grouped by AI model
 */
router.get('/chat/by-model', analyticsController.getMessagesByModel);

/**
 * GET /api/analytics/chat/activity
 * Get chat activity over time
 * Query params: startDate, endDate (YYYY-MM-DD)
 */
router.get('/chat/activity', analyticsController.getChatActivity);

/**
 * GET /api/analytics/chat/response-time
 * Get average response time by provider
 */
router.get('/chat/response-time', analyticsController.getResponseTimeByProvider);

/**
 * GET /api/analytics/chat/conversations
 * Get conversation statistics
 */
router.get('/chat/conversations', analyticsController.getConversationStats);

/**
 * GET /api/analytics/chat/tokens-by-plan
 * Get token usage by plan tier
 */
router.get('/chat/tokens-by-plan', analyticsController.getTokenUsageByPlan);

// ==================== REVENUE ANALYTICS ====================

/**
 * GET /api/analytics/revenue/total
 * Get total revenue
 */
router.get('/revenue/total', analyticsController.getTotalRevenue);

/**
 * GET /api/analytics/revenue/mrr
 * Get Monthly Recurring Revenue (MRR)
 */
router.get('/revenue/mrr', analyticsController.getMRR);

/**
 * GET /api/analytics/revenue/over-time
 * Get revenue over time
 * Query params: startDate, endDate (YYYY-MM-DD)
 */
router.get('/revenue/over-time', analyticsController.getRevenueOverTime);

/**
 * GET /api/analytics/revenue/by-plan
 * Get revenue by plan tier
 */
router.get('/revenue/by-plan', analyticsController.getRevenueByPlan);

/**
 * GET /api/analytics/revenue/subscriptions
 * Get subscription statistics
 */
router.get('/revenue/subscriptions', analyticsController.getSubscriptionStats);

/**
 * GET /api/analytics/revenue/failed-payments
 * Get failed payments
 * Query params: startDate, endDate (YYYY-MM-DD)
 */
router.get('/revenue/failed-payments', analyticsController.getFailedPayments);

/**
 * GET /api/analytics/revenue/ltv
 * Get customer lifetime value by cohort
 */
router.get('/revenue/ltv', analyticsController.getLTVByCohort);

// ==================== PROVIDER ANALYTICS ====================

/**
 * GET /api/analytics/providers/usage
 * Get overall provider usage statistics
 */
router.get('/providers/usage', analyticsController.getProviderUsage);

/**
 * GET /api/analytics/providers/:provider/models
 * Get provider usage by model
 * Path params: provider (string)
 */
router.get('/providers/:provider/models', analyticsController.getProviderUsageByModel);

/**
 * GET /api/analytics/providers/usage-over-time
 * Get provider usage over time
 * Query params: startDate, endDate (YYYY-MM-DD), provider (optional)
 */
router.get('/providers/usage-over-time', analyticsController.getProviderUsageOverTime);

/**
 * GET /api/analytics/providers/performance
 * Get provider performance comparison
 */
router.get('/providers/performance', analyticsController.getProviderPerformance);

/**
 * GET /api/analytics/providers/cost
 * Get provider cost estimation
 */
router.get('/providers/cost', analyticsController.getProviderCostEstimation);

/**
 * GET /api/analytics/providers/usage-by-plan
 * Get provider usage by plan tier
 */
router.get('/providers/usage-by-plan', analyticsController.getProviderUsageByPlan);

/**
 * GET /api/analytics/providers/popular-models
 * Get most popular AI models
 * Query params: limit (number, default: 10)
 */
router.get('/providers/popular-models', analyticsController.getPopularModels);

export default router;
