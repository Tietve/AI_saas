import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/chat
 * Send message and get AI response
 */
router.post('/chat', (req, res) => chatController.sendMessage(req, res));

/**
 * GET /api/conversations
 * Get all user conversations
 */
router.get('/conversations', (req, res) => chatController.getConversations(req, res));

/**
 * GET /api/conversations/:id
 * Get conversation by ID with messages
 */
router.get('/conversations/:id', (req, res) => chatController.getConversation(req, res));

/**
 * DELETE /api/conversations/:id
 * Delete conversation
 */
router.delete('/conversations/:id', (req, res) => chatController.deleteConversation(req, res));

/**
 * GET /api/usage
 * Get monthly token usage
 */
router.get('/usage', (req, res) => chatController.getUsage(req, res));

export default router;
