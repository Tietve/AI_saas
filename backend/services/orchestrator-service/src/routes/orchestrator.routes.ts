import { Router } from 'express';
import { upgradePrompt, getStats } from '../controllers/orchestrator.controller';
import { checkQuota } from '../middleware/quota.middleware';
import { validate } from '../middleware/validation.middleware';
import { upgradePromptSchema, statsQuerySchema } from '../validation/orchestrator.validation';

const router = Router();

// Upgrade prompt (with validation and quota check)
router.post(
  '/upgrade',
  validate(upgradePromptSchema, 'body'),
  checkQuota,
  upgradePrompt
);

// Get stats (with validation)
router.get(
  '/stats',
  validate(statsQuerySchema, 'query'),
  getStats
);

export default router;
