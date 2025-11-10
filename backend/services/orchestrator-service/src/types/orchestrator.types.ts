import { Message } from '../agents/summarizer.agent';

export interface OrchestrationRequest {
  userPrompt: string;
  conversationHistory?: Message[];
  userId?: string;
  conversationId?: string;
  options?: OrchestrationOptions;
}

export interface OrchestrationOptions {
  enableSummarization?: boolean;
  enableRAG?: boolean;
  enablePIIRedaction?: boolean;
  ragTopK?: number;
  ragMinScore?: number;
}

export interface OrchestrationResult {
  upgradedPrompt: string;
  originalPrompt: string;

  // Component results
  summary?: string;
  ragDocuments?: any[];
  piiRedacted?: boolean;

  // Metrics
  metrics: {
    totalLatencyMs: number;
    summaryLatencyMs?: number;
    ragLatencyMs?: number;
    upgradeLatencyMs?: number;
    totalTokensUsed: number;
    summaryTokens?: number;
    ragTokens?: number;
    upgradeTokens?: number;
  };

  // Metadata
  confidence: number;
  reasoning: string;
  missingQuestions: string[];
}

export interface PipelineStep {
  name: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
}
