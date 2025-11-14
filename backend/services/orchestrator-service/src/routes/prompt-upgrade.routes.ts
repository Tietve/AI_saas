import { Router } from 'express';
import { upgradePrompt, clearConversation } from '../controllers/prompt-upgrade.controller';

const router = Router();

/**
 * @route   POST /api/orchestrator/upgrade-prompt
 * @desc    Upgrade user prompt with multi-turn awareness
 * @access  Public (can add auth later)
 */
router.post('/upgrade-prompt', upgradePrompt);

/**
 * @route   DELETE /api/orchestrator/conversations/:conversationId
 * @desc    Clear conversation state
 * @access  Public (can add auth later)
 */
router.delete('/conversations/:conversationId', clearConversation);

export default router;
