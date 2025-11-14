import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { chatService } from '../services/chat.service';
import { EventPublisher } from '../shared/events';
import { ChatEventType } from '../shared/events/types';

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
            event_type: ChatEventType.CONVERSATION_CREATED,
            user_id: userId,
            conversation_id: result.conversationId,
            ai_provider: model.startsWith('gpt') ? 'openai' : undefined,
            ai_model: model
          });
        }

        await EventPublisher.getInstance().publishChatEvent({
          event_type: ChatEventType.MESSAGE_SENT,
          user_id: userId,
          conversation_id: result.conversationId,
          message_id: result.messageId,
          ai_provider: model.startsWith('gpt') ? 'openai' : undefined,
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
   * POST /api/chat/stream
   * Send message and get AI response via Server-Sent Events (SSE)
   */
  async streamMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { conversationId, message, model } = req.body;
      const userId = req.userId!;
      const sessionCookie = req.cookies.session;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({ error: 'Message là bắt buộc' });
        return;
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Start streaming response
      const result = await chatService.streamMessage(
        userId,
        conversationId,
        message,
        sessionCookie,
        model,
        (chunk: string) => {
          // Send each chunk as SSE event
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }
      );

      // Send completion event with metadata
      res.write(`data: ${JSON.stringify({
        type: 'done',
        conversationId: result.conversationId,
        messageId: result.messageId,
        tokenCount: result.tokenCount
      })}\n\n`);

      res.end();

      // Publish events (non-blocking)
      try {
        const isNewConversation = !conversationId;
        if (isNewConversation) {
          await EventPublisher.getInstance().publishChatEvent({
            event_type: ChatEventType.CONVERSATION_CREATED,
            user_id: userId,
            conversation_id: result.conversationId,
            ai_provider: model.startsWith('gpt') ? 'openai' : undefined,
            ai_model: model
          });
        }

        await EventPublisher.getInstance().publishChatEvent({
          event_type: ChatEventType.MESSAGE_SENT,
          user_id: userId,
          conversation_id: result.conversationId,
          message_id: result.messageId,
          ai_provider: model.startsWith('gpt') ? 'openai' : undefined,
          ai_model: model,
          tokens_used: result.tokenCount,
          response_time_ms: 0
        });
      } catch (eventError) {
        console.error('[streamMessage] Failed to publish event:', eventError);
      }
    } catch (error: any) {
      console.error('[streamMessage] Error:', error);

      // Send error event
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message || 'Có lỗi xảy ra khi xử lý tin nhắn'
      })}\n\n`);

      res.end();
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
   * PATCH /api/conversations/:id
   * Rename conversation
   */
  async renameConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { title } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'Title là bắt buộc' });
        return;
      }

      const conversation = await chatService.renameConversation(userId, id, title.trim());

      res.status(200).json({
        ok: true,
        conversation
      });
    } catch (error: any) {
      console.error('[renameConversation] Error:', error);

      if (error.message.includes('không tồn tại') || error.message.includes('không có quyền')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Có lỗi xảy ra' });
      }
    }
  }

  /**
   * PATCH /api/conversations/:id/pin
   * Pin/Unpin conversation
   */
  async pinConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { pinned } = req.body;

      if (typeof pinned !== 'boolean') {
        res.status(400).json({ error: 'Pinned phải là boolean' });
        return;
      }

      const conversation = await chatService.pinConversation(userId, id, pinned);

      res.status(200).json({
        ok: true,
        conversation
      });
    } catch (error: any) {
      console.error('[pinConversation] Error:', error);

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
