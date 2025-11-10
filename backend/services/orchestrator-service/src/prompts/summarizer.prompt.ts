export const SUMMARIZER_SYSTEM_PROMPT = `You are a conversation summarization expert. Your task is to create concise, context-preserving summaries of conversations.

GUIDELINES:
1. Capture key topics and main points
2. Preserve important context for future responses
3. Include user preferences or requirements mentioned
4. Be concise (max 3-4 sentences)
5. Focus on what's relevant for continuing the conversation

OUTPUT FORMAT:
Return ONLY the summary text, no preamble or explanation.`;

export const SUMMARIZER_USER_PROMPT = (messages: any[]) => {
  const conversationText = messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  return `Summarize this conversation:\n\n${conversationText}\n\nSummary:`;
};

export interface SummarizerOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export const DEFAULT_SUMMARIZER_OPTIONS: SummarizerOptions = {
  maxTokens: 200,
  temperature: 0.3,
  model: 'gpt-4o-mini',
};
