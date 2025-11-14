import { apiClient } from '@/shared/api/client';
import axios from 'axios';
import type { Message } from '@/shared/types';

// TODO: Remove this after Gateway is configured to proxy /api/prompts/* to chat-service
// Temporary direct connection to chat-service for testing
const chatServiceClient = axios.create({
  baseURL: 'http://localhost:3003/api',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Orchestrator service client for multi-turn RAG prompt upgrader
const orchestratorClient = axios.create({
  baseURL: 'http://localhost:3006/api',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request/Response types for Smart Prompt API
 */
export interface GenerateSmartPromptRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface GenerateSmartPromptResponse {
  ok: boolean;
  prompt: string;
  tokensUsed?: number;
}

/**
 * Request/Response types for Multi-Turn Prompt Upgrader API
 */
export interface UpgradePromptRequest {
  userMessage: string;
  conversationId?: string;
  userId: string;
  language?: 'vi' | 'en'; // User's preferred language for prompt output
}

export interface UpgradePromptResponse {
  success: boolean;
  data: {
    original: string;
    upgraded: string;
    reasoning: string;
    confidence: number;
    turnNumber: number;
    isFirstTurn: boolean;
    tokensUsed: number;
    latencyMs: number;
  };
}

/**
 * Smart Prompt API
 * Generates optimal follow-up prompts based on conversation context
 * Uses OpenAI meta-prompting (NOT RAG)
 */
export const promptsApi = {
  /**
   * Generate a smart prompt based on conversation context
   * POST /api/prompts/generate
   *
   * Takes last 5 messages and generates an optimal follow-up prompt
   *
   * @param messages - Conversation context (last 5 messages recommended)
   * @returns Generated prompt string
   */
  generate: async (messages: Message[]): Promise<GenerateSmartPromptResponse> => {
    // Convert UI Message type to API format
    const apiMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // TODO: Change back to apiClient when Gateway is configured
    const response = await chatServiceClient.post<GenerateSmartPromptResponse>(
      '/prompts/generate',
      { messages: apiMessages }
    );

    return response.data;
  },

  /**
   * Upgrade user prompt with Multi-Turn RAG awareness
   * POST /api/orchestrator/upgrade-prompt
   *
   * Uses conversation state to avoid redundancy in follow-up prompts
   * First turn: Full ROLE/TASK/CONTEXT/CONSTRAINTS/FORMAT prompt
   * Follow-up turns: Contextual enhancement only
   *
   * @param request - User message, conversationId, and userId
   * @returns Upgraded prompt with reasoning and metadata
   */
  upgradePrompt: async (request: UpgradePromptRequest): Promise<UpgradePromptResponse> => {
    const response = await orchestratorClient.post<UpgradePromptResponse>(
      '/orchestrator/upgrade-prompt',
      request
    );

    return response.data;
  },
};

/**
 * Helper function for use in hooks
 * Simplified interface that returns just the prompt string
 */
export async function generateSmartPrompt(
  messages: Message[]
): Promise<{ prompt: string }> {
  const response = await promptsApi.generate(messages);
  return { prompt: response.prompt };
}

/**
 * Helper function for Multi-Turn Prompt Upgrader
 * Takes the last user message and generates an upgraded prompt
 */
export async function upgradeUserPrompt(
  userMessage: string,
  conversationId: string | null,
  userId: string,
  language?: 'vi' | 'en'
): Promise<{
  prompt: string;
  reasoning: string;
  confidence: number;
  turnNumber: number;
  isFirstTurn: boolean;
  tokensUsed: number;
  latencyMs: number;
}> {
  const response = await promptsApi.upgradePrompt({
    userMessage,
    conversationId: conversationId || undefined,
    userId,
    language,
  });

  return {
    prompt: response.data.upgraded,
    reasoning: response.data.reasoning,
    confidence: response.data.confidence,
    turnNumber: response.data.turnNumber,
    isFirstTurn: response.data.isFirstTurn,
    tokensUsed: response.data.tokensUsed,
    latencyMs: response.data.latencyMs,
  };
}
