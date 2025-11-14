import { Request, Response } from 'express';
import { conversationStateService } from '../services/conversation-state.service';
import { OpenAI } from 'openai';
import { env } from '../config/env.config';
import logger from '../config/logger.config';

const openai = new OpenAI({
  apiKey: env.openai.apiKey,
});

export interface UpgradePromptRequest {
  userMessage: string;
  conversationId?: string;
  userId: string;
  language?: 'vi' | 'en';
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
 * Upgrade user prompt with multi-turn awareness
 */
export async function upgradePrompt(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const { userMessage, conversationId, userId, language } = req.body as UpgradePromptRequest;

    // Validation
    if (!userMessage || !userId) {
      return res.status(400).json({
        success: false,
        error: 'userMessage and userId are required',
      });
    }

    // Generate conversationId if not provided
    const convId = conversationId || `conv_${userId}_${Date.now()}`;

    logger.info(`[PromptUpgrade] Upgrading for user ${userId}, conversation ${convId}`);

    const startTime = Date.now();

    // Get conversation state
    const state = await conversationStateService.getOrCreate(convId, userId);
    const isFirstTurn = conversationStateService.isFirstTurn(state);

    // Build prompt based on turn
    let systemPrompt: string;
    let userPrompt: string;

    const isVietnamese = language === 'vi';

    if (isFirstTurn) {
      // FIRST TURN: Full prompt with ROLE/TASK/CONTEXT/FORMAT
      systemPrompt = isVietnamese
        ? `Bạn là một chuyên gia thiết kế prompt chuyên nghiệp và chi tiết.

Nhiệm vụ của bạn: Xây dựng một prompt HOÀN CHỈNH chuyên nghiệp theo các phương pháp hay nhất:

1. **Định nghĩa VAI TRÒ**: Xác định rõ persona và trình độ chuyên môn
2. **Chỉ định NHIỆM VỤ**: Mục tiêu rõ ràng, có thể hành động
3. **Cung cấp NGỮ CẢNH**: Thông tin nền liên quan
4. **Đặt RÀNG BUỘC**: Yêu cầu về độ dài, phong cách, chất lượng
5. **Định nghĩa ĐỊNH DẠNG**: Cấu trúc đầu ra

Làm cho prompt toàn diện, rõ ràng và chuyên nghiệp. Đây là tương tác ĐẦU TIÊN, vì vậy hãy thiết lập mọi thứ cần thiết.

QUAN TRỌNG: Chỉ trả về JSON hợp lệ với định dạng chính xác này:
{
  "final_prompt": "prompt đã nâng cấp hoàn chỉnh ở đây",
  "reasoning": "tại sao bạn cấu trúc theo cách này",
  "confidence": 0.9
}`
        : `You are an expert prompt engineer specializing in creating professional, detailed prompts.

Your task: Build a COMPLETE professional prompt following best practices:

1. **Define ROLE**: Set clear persona and expertise level
2. **Specify TASK**: Clear, actionable objective
3. **Provide CONTEXT**: Relevant background information
4. **Set CONSTRAINTS**: Length, style, quality requirements
5. **Define FORMAT**: Output structure

Make the prompt comprehensive, clear, and professional. This is the FIRST interaction, so establish everything needed.

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "final_prompt": "the complete upgraded prompt here",
  "reasoning": "why you structured it this way",
  "confidence": 0.9
}`;

      userPrompt = isVietnamese
        ? `Yêu cầu của người dùng: "${userMessage}"\n\nTạo một prompt chuyên nghiệp hoàn chỉnh theo khung 5 bước ở trên.`
        : `User's request: "${userMessage}"\n\nCreate a complete professional prompt following the 5-step framework above.`;
    } else {
      // FOLLOW-UP TURN: Contextual enhancement only
      const contextSummary = conversationStateService.buildContextSummary(state);

      systemPrompt = isVietnamese
        ? `Bạn đang tiếp tục một cuộc trò chuyện.

Ngữ cảnh trước đó:
${contextSummary}

Nhiệm vụ của bạn: Xây dựng một prompt cải tiến CÓ NGỮ CẢNH:
- KHÔNG lặp lại vai trò/persona (đã được thiết lập)
- Tham chiếu ngữ cảnh đang diễn ra một cách tự nhiên
- Thêm các hướng dẫn mới liên quan dựa trên câu hỏi hiện tại
- Giữ nó ngắn gọn và tập trung
- Chỉ bao gồm những gì MỚI và cần thiết

Đây là tin nhắn tiếp theo, vì vậy hãy nói chuyện nhưng chuyên nghiệp.

QUAN TRỌNG: Chỉ trả về JSON hợp lệ với định dạng chính xác này:
{
  "final_prompt": "prompt cải tiến có ngữ cảnh ở đây",
  "reasoning": "tại sao cách tiếp cận này phù hợp với cuộc trò chuyện",
  "confidence": 0.9
}`
        : `You are continuing a conversation.

Previous context:
${contextSummary}

Your task: Build a CONTEXTUAL prompt enhancement that:
- Does NOT repeat the role/persona (already established)
- References the ongoing context naturally
- Adds new relevant instructions based on current question
- Keeps it concise and focused
- Only includes what's NEW and needed

This is a follow-up message, so be conversational but professional.

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "final_prompt": "the contextual enhancement here",
  "reasoning": "why this approach fits the conversation",
  "confidence": 0.9
}`;

      userPrompt = isVietnamese
        ? `Câu hỏi tiếp theo của người dùng: "${userMessage}"\n\nTạo một cải tiến có ngữ cảnh (KHÔNG phải prompt đầy đủ). Tham chiếu ngữ cảnh hiện có một cách tự nhiên.`
        : `User's follow-up: "${userMessage}"\n\nCreate a contextual enhancement (NOT a full prompt). Reference the existing context naturally.`;
    }

    // Call GPT-4
    const response = await openai.chat.completions.create({
      model: env.models.upgrader || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: isFirstTurn ? 2000 : 1000,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0].message.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      logger.error('[PromptUpgrade] Failed to parse GPT response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    const upgradedPrompt = parsed.final_prompt || userMessage;
    const reasoning = parsed.reasoning || 'No reasoning provided';
    const confidence = parsed.confidence || 0.8;
    const tokensUsed = response.usage?.total_tokens || 0;

    // Extract role/task from first turn
    if (isFirstTurn) {
      const roleMatch = upgradedPrompt.match(/You are (?:a|an) ([^.]+)/i);
      const taskMatch = upgradedPrompt.match(/Your task is to ([^.]+)/i);

      if (roleMatch || taskMatch) {
        await conversationStateService.updateContext(convId, {
          role: roleMatch ? roleMatch[1].trim() : undefined,
          task: taskMatch ? taskMatch[1].trim() : undefined,
        });
      }
    }

    // Save message
    await conversationStateService.addMessage(convId, {
      role: 'user',
      content: userMessage,
      upgradedPrompt,
      timestamp: new Date(),
    });

    // Increment turn
    await conversationStateService.incrementTurn(convId);

    logger.info(
      `[PromptUpgrade] Success: Turn ${state.turnNumber + 1}, ${tokensUsed} tokens, ${latencyMs}ms`
    );

    const responseData: UpgradePromptResponse = {
      success: true,
      data: {
        original: userMessage,
        upgraded: upgradedPrompt,
        reasoning,
        confidence,
        turnNumber: state.turnNumber + 1,
        isFirstTurn,
        tokensUsed,
        latencyMs,
      },
    };

    return res.status(200).json(responseData);
  } catch (error) {
    logger.error('[PromptUpgrade] Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * Clear conversation state
 */
export async function clearConversation(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId is required',
      });
    }

    await conversationStateService.clear(conversationId);

    logger.info(`[PromptUpgrade] Cleared conversation: ${conversationId}`);

    return res.status(200).json({
      success: true,
      message: 'Conversation cleared successfully',
    });
  } catch (error) {
    logger.error('[PromptUpgrade] Error clearing conversation:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
