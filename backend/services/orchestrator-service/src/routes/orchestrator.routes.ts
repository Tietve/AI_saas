import { Router } from 'express';
import { upgradePrompt, getStats } from '../controllers/orchestrator.controller';
import { checkQuota } from '../middleware/quota.middleware';

const router = Router();

// Upgrade prompt (with quota check)
router.post('/upgrade', checkQuota, upgradePrompt);

// Get stats
router.get('/stats', getStats);

export default router;
