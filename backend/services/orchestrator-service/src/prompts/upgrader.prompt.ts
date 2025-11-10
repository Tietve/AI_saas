export const UPGRADER_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to upgrade user prompts to be more effective for LLMs.

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
- Maintain user's tone and intent`;

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
