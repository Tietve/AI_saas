import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateSmartPrompt, upgradeUserPrompt } from '@/features/chat/api/promptsApi';
import type { Message } from '@/shared/types';

interface UseSmartPromptOptions {
  onSuccess?: (prompt: string, metadata?: PromptMetadata) => void;
  onError?: (error: Error) => void;
  conversationId?: string | null;
  userId?: string;
  useMultiTurn?: boolean; // Toggle between old and new API
}

interface PromptMetadata {
  reasoning: string;
  confidence: number;
  turnNumber: number;
  isFirstTurn: boolean;
  tokensUsed: number;
  latencyMs: number;
}

interface UseSmartPromptReturn {
  isGenerating: boolean;
  error: string | null;
  generatePrompt: (messages: Message[]) => Promise<void>;
  upgradePrompt: (userMessage: string) => Promise<void>;
}

/**
 * Hook for generating smart prompts based on conversation context
 * Supports both legacy meta-prompting and new Multi-Turn RAG upgrader
 *
 * @example
 * const { isGenerating, error, upgradePrompt } = useSmartPrompt({
 *   conversationId: activeConversationId,
 *   userId: user.id,
 *   useMultiTurn: true,
 *   onSuccess: (prompt, metadata) => {
 *     setMessage(prompt);
 *     console.log('Turn:', metadata.turnNumber, 'First:', metadata.isFirstTurn);
 *   },
 *   onError: (error) => toast.error(error.message)
 * });
 */
export function useSmartPrompt(options: UseSmartPromptOptions = {}): UseSmartPromptReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { i18n } = useTranslation();

  // Get current language (vi or en)
  const currentLanguage = (i18n.language === 'vi' ? 'vi' : 'en') as 'vi' | 'en';

  // Legacy: Generate prompt from message history
  const generatePrompt = async (messages: Message[]) => {
    try {
      setIsGenerating(true);
      setError(null);

      // Take last 5 messages for context
      const context = messages.slice(-5);

      // Call API to generate prompt
      const result = await generateSmartPrompt(context);

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(result.prompt);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate prompt';
      setError(errorMessage);

      // Call error callback
      if (options.onError) {
        options.onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // New: Upgrade user prompt with Multi-Turn RAG awareness
  const upgradePrompt = async (userMessage: string) => {
    try {
      setIsGenerating(true);
      setError(null);

      // Validate required fields for multi-turn
      if (!options.userId) {
        throw new Error('userId is required for prompt upgrade');
      }

      // Call new Multi-Turn API with current language
      const result = await upgradeUserPrompt(
        userMessage,
        options.conversationId || null,
        options.userId,
        currentLanguage
      );

      // Call success callback with metadata
      if (options.onSuccess) {
        options.onSuccess(result.prompt, {
          reasoning: result.reasoning,
          confidence: result.confidence,
          turnNumber: result.turnNumber,
          isFirstTurn: result.isFirstTurn,
          tokensUsed: result.tokensUsed,
          latencyMs: result.latencyMs,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade prompt';
      setError(errorMessage);

      // Call error callback
      if (options.onError) {
        options.onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    error,
    generatePrompt,
    upgradePrompt,
  };
}
