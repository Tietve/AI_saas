import { Router } from 'express';
import { promptsController } from '../controllers/prompts.controller';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// All routes require authentication
// TODO: Re-enable after end-to-end testing
// router.use(authenticateToken);

// Rate limiting: 10 requests per minute per user
// Prevents abuse of OpenAI API which costs money
const promptRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    ok: false,
    error: 'Too many prompt generation requests. Please try again in a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use userId from auth middleware for rate limiting
  keyGenerator: (req) => {
    return (req as any).userId || req.ip || 'unknown';
  },
});

/**
 * POST /api/prompts/generate
 * Generate a smart prompt based on conversation context
 * Rate limited: 10 requests/minute per user
 */
router.post('/generate', promptRateLimiter, (req, res) =>
  promptsController.generatePrompt(req, res)
);

export default router;
