import OpenAI from 'openai';
import { config } from '../config/env';

/**
 * Smart Prompt Generation Service
 * Uses OpenAI meta-prompting to generate optimal follow-up prompts
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

class PromptsService {
  private openai: OpenAI;

  constructor() {
    if (!config.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a smart prompt based on conversation context
   * Uses meta-prompting technique with gpt-4o-mini for cost efficiency
   *
   * @param messages - Last 5 messages from conversation
   * @returns Generated prompt string
   */
  async generateSmartPrompt(messages: Message[]): Promise<string> {
    if (!messages || messages.length === 0) {
      throw new Error('No conversation context provided');
    }

    // Limit to last 5 messages to control cost
    const contextMessages = messages.slice(-5);

    // Build conversation summary for the meta-prompt
    const conversationSummary = contextMessages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    // Meta-prompt: Ask AI to generate an optimal follow-up prompt
    const metaPrompt = `You are a prompt engineering expert. Analyze this conversation and generate ONE concise, specific follow-up prompt that would be most valuable for the user to ask next.

Conversation Context:
${conversationSummary}

Based on this conversation:
1. Identify the main topic and user's learning goal
2. Determine what logical next question would deepen understanding
3. Generate a clear, specific prompt (1-2 sentences max)

Return ONLY the suggested prompt text, nothing else. Do not include explanations or quotation marks.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model (~$0.001/request)
        messages: [
          {
            role: 'user',
            content: metaPrompt,
          },
        ],
        temperature: 0.7, // Balance between creativity and consistency
        max_tokens: 100, // Keep prompts concise
      });

      const generatedPrompt = completion.choices[0]?.message?.content?.trim();

      if (!generatedPrompt) {
        throw new Error('Failed to generate prompt from OpenAI');
      }

      return generatedPrompt;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate smart prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get token count for billing purposes
   */
  getTokenCount(prompt: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(prompt.length / 4);
  }
}

export const promptsService = new PromptsService();
