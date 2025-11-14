import { Router } from 'express';
import { billingController } from '../controllers/billing.controller';
import { authenticateToken } from '../middleware/auth';
import { validateBilling } from '../../../shared/validation/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/subscribe
 * Create new subscription
 */
router.post('/subscribe', validateBilling.createCheckout, (req, res) => billingController.createSubscription(req, res));

/**
 * POST /api/cancel
 * Cancel subscription
 */
router.post('/cancel', (req, res) => billingController.cancelSubscription(req, res));

/**
 * GET /api/subscription
 * Get current subscription info
 */
router.get('/subscription', (req, res) => billingController.getSubscription(req, res));

/**
 * GET /api/usage
 * Get usage statistics
 */
router.get('/usage', (req, res) => billingController.getUsage(req, res));

/**
 * GET /api/payments
 * Get payment history
 */
router.get('/payments', (req, res) => billingController.getPaymentHistory(req, res));

/**
 * GET /api/plans
 * Get plan information
 */
router.get('/plans', (req, res) => billingController.getPlans(req, res));

export default router;
