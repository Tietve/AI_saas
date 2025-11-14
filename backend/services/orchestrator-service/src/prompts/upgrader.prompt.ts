export const UPGRADER_SYSTEM_PROMPT_EN = `You are an expert prompt engineer. Your task is to upgrade user prompts to be more effective for LLMs.

GOALS:
1. Clarify ambiguous instructions
2. Add helpful context from conversation summary and knowledge base
3. Structure the prompt for optimal LLM performance
4. Preserve user's original intent

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "final_prompt": "The upgraded prompt with ROLE/TASK/CONTEXT/CONSTRAINTS/FORMAT",
  "reasoning": "Brief explanation of improvements made",
  "missing_questions": ["Any clarifying questions if needed"],
  "confidence": 0.95
}

GUIDELINES:
- Be concise but comprehensive
- Add context without overwhelming the prompt
- Use clear, structured language
- Identify gaps and suggest clarifying questions
- Maintain user's tone and intent
- Output in ENGLISH`;

export const UPGRADER_SYSTEM_PROMPT_VI = `Bạn là một chuyên gia thiết kế prompt. Nhiệm vụ của bạn là nâng cấp prompt của người dùng để hiệu quả hơn với các mô hình ngôn ngữ lớn (LLM).

MỤC TIÊU:
1. Làm rõ các hướng dẫn mơ hồ
2. Thêm ngữ cảnh hữu ích từ cuộc trò chuyện và cơ sở tri thức
3. Cấu trúc prompt để tối ưu hiệu suất LLM
4. Giữ nguyên ý định ban đầu của người dùng

ĐỊNH DẠNG ĐẦU RA:
Trả về một đối tượng JSON với cấu trúc này:
{
  "final_prompt": "Prompt đã nâng cấp với VAI TRÒ/NHIỆM VỤ/NGỮ CẢNH/RÀNG BUỘC/ĐỊNH DẠNG",
  "reasoning": "Giải thích ngắn gọn về các cải tiến đã thực hiện",
  "missing_questions": ["Các câu hỏi làm rõ nếu cần"],
  "confidence": 0.95
}

HƯỚNG DẪN:
- Ngắn gọn nhưng toàn diện
- Thêm ngữ cảnh mà không làm quá tải prompt
- Sử dụng ngôn ngữ rõ ràng, có cấu trúc
- Xác định các khoảng trống và đề xuất câu hỏi làm rõ
- Duy trì giọng điệu và ý định của người dùng
- Output bằng TIẾNG VIỆT`;

// Backward compatibility
export const UPGRADER_SYSTEM_PROMPT = UPGRADER_SYSTEM_PROMPT_EN;

/**
 * Get system prompt based on language
 */
export function getUpgraderSystemPrompt(language?: 'vi' | 'en'): string {
  return language === 'vi' ? UPGRADER_SYSTEM_PROMPT_VI : UPGRADER_SYSTEM_PROMPT_EN;
}

export interface UpgraderInput {
  userPrompt: string;
  conversationSummary?: string;
  ragContext?: string;
  additionalContext?: Record<string, any>;
}

export const UPGRADER_USER_PROMPT = (input: UpgraderInput) => {
  const parts: string[] = [];

  parts.push(`USER PROMPT:\n${input.userPrompt}`);

  if (input.conversationSummary) {
    parts.push(`\nCONVERSATION CONTEXT:\n${input.conversationSummary}`);
  }

  if (input.ragContext) {
    parts.push(`\nRELEVANT KNOWLEDGE:\n${input.ragContext}`);
  }

  if (input.additionalContext && Object.keys(input.additionalContext).length > 0) {
    parts.push(`\nADDITIONAL CONTEXT:\n${JSON.stringify(input.additionalContext, null, 2)}`);
  }

  parts.push('\nUpgrade this prompt following the JSON format specified in the system prompt.');

  return parts.join('\n');
};

export interface UpgraderOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export const DEFAULT_UPGRADER_OPTIONS: UpgraderOptions = {
  maxTokens: 500,
  temperature: 0.4,
  model: 'gpt-4o-mini',
};
