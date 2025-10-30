import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { chatService } from '../services/chat.service';
import { EventPublisher } from '../shared/events';

export class ChatController {
  /**
   * POST /api/chat
   * Send message and get AI response
   */
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { conversationId, message, model } = req.body;
      const userId = req.userId!;
      const sessionCookie = req.cookies.session;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({ error: 'Message là bắt buộc' });
        return;
      }

      const result = await chatService.sendMessage(userId, conversationId, message, sessionCookie, model);

      // Publish chat event to analytics (non-blocking)
      try {
        const isNewConversation = !conversationId;

        if (isNewConversation) {
          await EventPublisher.getInstance().publishChatEvent({
            event_type: 'chat.conversation_started',
            user_id: userId,
            conversation_id: result.conversationId,
            ai_provider: model.startsWith('gpt') ? 'openai' : 'unknown',
            ai_model: model
          });
        }

        await EventPublisher.getInstance().publishChatEvent({
          event_type: 'chat.message_sent',
          user_id: userId,
          conversation_id: result.conversationId,
          message_id: result.messageId,
          ai_provider: model.startsWith('gpt') ? 'openai' : 'unknown',
          ai_model: model,
          tokens_used: result.tokenCount,
          response_time_ms: 0 // Could be calculated if we track start time
        });
      } catch (eventError) {
        console.error('[sendMessage] Failed to publish event:', eventError);
        // Don't fail the request if event publishing fails
      }

      res.status(200).json({
        ok: true,
        conversationId: result.conversationId,
        messageId: result.messageId,
        content: result.content,
        tokenCount: result.tokenCount
      });
    } catch (error: any) {
      console.error('[sendMessage] Error:', error);

      if (error.message.includes('không tồn tại') || error.message.includes('không có quyền')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('quota') || error.message.includes('hết quota')) {
        res.status(429).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Có lỗi xảy ra khi xử lý tin nhắn' });
      }
    }
  }

  /**
   * GET /api/conversations
   * Get all user conversations
   */
  async getConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const conversations = await chatService.getUserConversations(userId);

      res.status(200).json({
        ok: true,
        conversations
      });
    } catch (error: any) {
      console.error('[getConversations] Error:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
  }

  /**
   * GET /api/conversations/:id
   * Get conversation by ID
   */
  async getConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const conversation = await chatService.getConversation(userId, id);

      res.status(200).json({
        ok: true,
        conversation
      });
    } catch (error: any) {
      console.error('[getConversation] Error:', error);

      if (error.message.includes('không tồn tại') || error.message.includes('không có quyền')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Có lỗi xảy ra' });
      }
    }
  }

  /**
   * DELETE /api/conversations/:id
   * Delete conversation
   */
  async deleteConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      await chatService.deleteConversation(userId, id);

      res.status(200).json({
        ok: true,
        message: 'Đã xóa conversation'
      });
    } catch (error: any) {
      console.error('[deleteConversation] Error:', error);

      if (error.message.includes('không có quyền')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Có lỗi xảy ra' });
      }
    }
  }

  /**
   * GET /api/usage
   * Get monthly token usage
   */
  async getUsage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const monthlyUsage = await chatService.getMonthlyUsage(userId);

      res.status(200).json({
        ok: true,
        monthlyUsage
      });
    } catch (error: any) {
      console.error('[getUsage] Error:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
  }
}

export const chatController = new ChatController();
