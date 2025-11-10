import { Router } from 'express';
import { upgradePrompt, getStats } from '../controllers/orchestrator.controller';

const router = Router();

// Upgrade prompt
router.post('/upgrade', upgradePrompt);

// Get stats
router.get('/stats', getStats);

export default router;
