import { Request, Response } from 'express';
import { promptsService } from '../services/prompts.service';

/**
 * Prompts Controller
 * Handles smart prompt generation requests
 */

interface AuthRequest extends Request {
  userId?: string;
}

interface GeneratePromptRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

class PromptsController {
  /**
   * POST /api/prompts/generate
   * Generate a smart prompt based on conversation context
   */
  async generatePrompt(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { messages } = req.body as GeneratePromptRequest;

      // Validation
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          ok: false,
          error: 'Messages array is required',
        });
      }

      if (messages.length === 0) {
        return res.status(400).json({
          ok: false,
          error: 'At least one message is required for context',
        });
      }

      // Validate message structure
      const isValidMessages = messages.every(
        (msg) =>
          msg &&
          typeof msg === 'object' &&
          (msg.role === 'user' || msg.role === 'assistant') &&
          typeof msg.content === 'string' &&
          msg.content.trim().length > 0
      );

      if (!isValidMessages) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid message format',
        });
      }

      // Generate smart prompt using OpenAI
      const generatedPrompt = await promptsService.generateSmartPrompt(messages);
      const tokensUsed = promptsService.getTokenCount(generatedPrompt);

      return res.status(200).json({
        ok: true,
        prompt: generatedPrompt,
        tokensUsed,
      });
    } catch (error) {
      console.error('Error generating prompt:', error);

      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to generate prompt',
      });
    }
  }
}

export const promptsController = new PromptsController();
