import OpenAI from 'openai';
import { env } from '../config/env.config';
import logger from '../config/logger.config';
import {
  conversationStateService,
  ConversationStateData,
} from '../services/conversation-state.service';
import { multiTurnRAGService } from '../services/multi-turn-rag.service';
import { RAGDocument } from './rag-retriever.agent';

export interface SmartUpgradeInput {
  userMessage: string;
  conversationId: string;
  userId: string;
  language?: 'vi' | 'en'; // Preferred output language
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface SmartUpgradeResult {
  upgradedPrompt: string;
  reasoning: string;
  confidence: number;
  turnNumber: number;
  isFirstTurn: boolean;
  knowledgeUsed: number;
  tokensUsed: number;
  latencyMs: number;
}

/**
 * Smart Prompt Upgrader with Multi-Turn Context Awareness
 */
export class SmartPromptUpgraderAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.openai.apiKey,
      organization: env.openai.orgId,
    });
  }

  /**
   * Upgrade prompt with multi-turn awareness
   */
  public async upgrade(input: SmartUpgradeInput): Promise<SmartUpgradeResult> {
    const startTime = Date.now();

    try {
      // Get or create conversation state
      const state = await conversationStateService.getOrCreate(
        input.conversationId,
        input.userId
      );

      const isFirstTurn = conversationStateService.isFirstTurn(state);

      logger.info(
        `[SmartUpgrader] Turn ${state.turnNumber + 1} (${isFirstTurn ? 'FIRST' : 'FOLLOW-UP'}) - "${input.userMessage.substring(0, 50)}..."`
      );

      // Check for topic shift
      if (
        !isFirstTurn &&
        multiTurnRAGService.detectTopicShift(input.userMessage, state)
      ) {
        logger.info('[SmartUpgrader] Topic shift detected - resetting state');
        await conversationStateService.clear(input.conversationId);
        // Re-get state (will be new first turn)
        return this.upgrade(input);
      }

      // Decide if we need new knowledge
      const shouldRetrieve =
        await multiTurnRAGService.shouldRetrieveNewKnowledge(
          input.userMessage,
          state
        );

      let knowledge: RAGDocument[] = [];
      if (shouldRetrieve) {
        const ragResult = await multiTurnRAGService.retrieve(
          input.userMessage,
          input.conversationId,
          input.userId
        );
        knowledge = ragResult.documents;
      }

      // Build appropriate prompt based on turn
      let upgradedPrompt: string;
      let reasoning: string;
      let confidence: number;
      let tokensUsed: number;

      if (isFirstTurn) {
        const result = await this.buildFirstTurnPrompt(
          input.userMessage,
          knowledge,
          input.language,
          input.options
        );
        upgradedPrompt = result.prompt;
        reasoning = result.reasoning;
        confidence = result.confidence;
        tokensUsed = result.tokensUsed;

        // Extract and save context
        await this.extractAndSaveContext(
          input.conversationId,
          upgradedPrompt,
          input.userMessage
        );
      } else {
        const result = await this.buildFollowUpPrompt(
          input.userMessage,
          knowledge,
          state,
          input.language,
          input.options
        );
        upgradedPrompt = result.prompt;
        reasoning = result.reasoning;
        confidence = result.confidence;
        tokensUsed = result.tokensUsed;
      }

      // Save message to history
      await conversationStateService.addMessage(input.conversationId, {
        role: 'user',
        content: input.userMessage,
        upgradedPrompt,
        timestamp: new Date(),
      });

      // Increment turn
      await conversationStateService.incrementTurn(input.conversationId);

      const latencyMs = Date.now() - startTime;

      logger.info(
        `[SmartUpgrader] Completed in ${latencyMs}ms (${tokensUsed} tokens, confidence: ${confidence})`
      );

      return {
        upgradedPrompt,
        reasoning,
        confidence,
        turnNumber: state.turnNumber + 1,
        isFirstTurn,
        knowledgeUsed: knowledge.length,
        tokensUsed,
        latencyMs,
      };
    } catch (error) {
      logger.error('[SmartUpgrader] Failed:', error);
      throw error;
    }
  }

  /**
   * Build FULL prompt for first turn
   */
  private async buildFirstTurnPrompt(
    userMessage: string,
    knowledge: RAGDocument[],
    language?: 'vi' | 'en',
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<{
    prompt: string;
    reasoning: string;
    confidence: number;
    tokensUsed: number;
  }> {
    const knowledgeContext = multiTurnRAGService.formatContext(
      knowledge,
      true
    );

    const isVietnamese = language === 'vi';

    const systemPrompt = isVietnamese
      ? `Bạn là một chuyên gia thiết kế prompt chuyên nghiệp và chi tiết.

${knowledgeContext}

Nhiệm vụ của bạn: Xây dựng một prompt HOÀN CHỈNH chuyên nghiệp theo các phương pháp hay nhất:

1. **Định nghĩa VAI TRÒ**: Xác định rõ persona và trình độ chuyên môn
2. **Chỉ định NHIỆM VỤ**: Mục tiêu rõ ràng, có thể hành động
3. **Cung cấp NGỮ CẢNH**: Thông tin nền liên quan
4. **Đặt RÀNG BUỘC**: Yêu cầu về độ dài, phong cách, chất lượng
5. **Định nghĩa ĐỊNH DẠNG**: Cấu trúc đầu ra

Làm cho prompt toàn diện, rõ ràng và chuyên nghiệp. Đây là tương tác ĐẦU TIÊN, vì vậy hãy thiết lập mọi thứ cần thiết.

Trả về định dạng JSON:
{
  "final_prompt": "prompt đã nâng cấp",
  "reasoning": "tại sao bạn cấu trúc theo cách này",
  "confidence": 0.0-1.0
}`
      : `You are an expert prompt engineer specializing in creating professional, detailed prompts.

${knowledgeContext}

Your task: Build a COMPLETE professional prompt following best practices:

1. **Define ROLE**: Set clear persona and expertise level
2. **Specify TASK**: Clear, actionable objective
3. **Provide CONTEXT**: Relevant background information
4. **Set CONSTRAINTS**: Length, style, quality requirements
5. **Define FORMAT**: Output structure

Make the prompt comprehensive, clear, and professional. This is the FIRST interaction, so establish everything needed.

Return JSON format:
{
  "final_prompt": "the upgraded prompt",
  "reasoning": "why you structured it this way",
  "confidence": 0.0-1.0
}`;

    const response = await this.openai.chat.completions.create({
      model: options?.temperature !== undefined ? 'gpt-4o-mini' : env.models.upgrader,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `User's request: "${userMessage}"\n\nCreate a complete professional prompt.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2000,
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      prompt: parsed.final_prompt || userMessage,
      reasoning: parsed.reasoning || 'First turn: Full prompt created',
      confidence: parsed.confidence || 0.8,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  /**
   * Build CONTEXTUAL prompt for follow-up turns
   */
  private async buildFollowUpPrompt(
    userMessage: string,
    knowledge: RAGDocument[],
    state: ConversationStateData,
    language?: 'vi' | 'en',
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<{
    prompt: string;
    reasoning: string;
    confidence: number;
    tokensUsed: number;
  }> {
    const knowledgeContext =
      knowledge.length > 0
        ? multiTurnRAGService.formatContext(knowledge, false)
        : '';

    const conversationSummary =
      conversationStateService.buildContextSummary(state);

    const isVietnamese = language === 'vi';

    const systemPrompt = isVietnamese
      ? `Bạn đang tiếp tục một cuộc trò chuyện.

Ngữ cảnh trước đó:
${conversationSummary}

${knowledgeContext}

Nhiệm vụ của bạn: Xây dựng một prompt cải tiến CÓ NGỮ CẢNH:
- KHÔNG lặp lại vai trò/persona (đã được thiết lập)
- Tham chiếu ngữ cảnh đang diễn ra một cách tự nhiên
- Thêm các hướng dẫn mới liên quan dựa trên câu hỏi hiện tại
- Giữ nó ngắn gọn và tập trung
- Chỉ bao gồm những gì MỚI và cần thiết

Đây là tin nhắn tiếp theo, vì vậy hãy nói chuyện nhưng chuyên nghiệp.

Trả về định dạng JSON:
{
  "final_prompt": "prompt cải tiến có ngữ cảnh",
  "reasoning": "tại sao cách tiếp cận này phù hợp với cuộc trò chuyện",
  "confidence": 0.0-1.0
}`
      : `You are continuing a conversation.

Previous context:
${conversationSummary}

${knowledgeContext}

Your task: Build a CONTEXTUAL prompt enhancement that:
- Does NOT repeat the role/persona (already established)
- References the ongoing context naturally
- Adds new relevant instructions based on current question
- Keeps it concise and focused
- Only includes what's NEW and needed

This is a follow-up message, so be conversational but professional.

Return JSON format:
{
  "final_prompt": "the contextual prompt enhancement",
  "reasoning": "why this approach fits the conversation",
  "confidence": 0.0-1.0
}`;

    const response = await this.openai.chat.completions.create({
      model: options?.temperature !== undefined ? 'gpt-4o-mini' : env.models.upgrader,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `User's follow-up: "${userMessage}"\n\nCreate a contextual enhancement (NOT a full prompt).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 1000, // Shorter for follow-ups
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      prompt: parsed.final_prompt || userMessage,
      reasoning:
        parsed.reasoning || 'Follow-up turn: Contextual enhancement added',
      confidence: parsed.confidence || 0.8,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  /**
   * Extract role/task/domain from first turn prompt
   */
  private async extractAndSaveContext(
    conversationId: string,
    upgradedPrompt: string,
    userMessage: string
  ): Promise<void> {
    try {
      // Simple extraction using patterns
      const roleMatch = upgradedPrompt.match(
        /You are (?:a|an) ([^.]+)/i
      );
      const taskMatch = upgradedPrompt.match(
        /Your task is to ([^.]+)/i
      );

      // Detect domain from keywords
      const domains = {
        backend: ['backend', 'api', 'server', 'database', 'node'],
        frontend: ['frontend', 'react', 'ui', 'component', 'css'],
        data: ['data', 'analytics', 'ml', 'model', 'dataset'],
        devops: ['docker', 'deployment', 'ci/cd', 'kubernetes'],
      };

      let detectedDomain: string | undefined;
      const combinedText = `${userMessage} ${upgradedPrompt}`.toLowerCase();

      for (const [domain, keywords] of Object.entries(domains)) {
        if (keywords.some((kw) => combinedText.includes(kw))) {
          detectedDomain = domain;
          break;
        }
      }

      await conversationStateService.updateContext(conversationId, {
        role: roleMatch ? roleMatch[1].trim() : undefined,
        task: taskMatch ? taskMatch[1].trim() : undefined,
        domain: detectedDomain,
      });

      logger.debug(
        `[SmartUpgrader] Extracted context - Role: ${roleMatch?.[1] || 'unknown'}, Domain: ${detectedDomain || 'unknown'}`
      );
    } catch (error) {
      logger.error('[SmartUpgrader] Failed to extract context:', error);
      // Don't throw - context extraction is optional
    }
  }
}

// Export singleton
export const smartPromptUpgraderAgent = new SmartPromptUpgraderAgent();
