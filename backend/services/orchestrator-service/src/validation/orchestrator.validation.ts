import { z } from 'zod';

// Message schema for conversation history
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty'),
});

// Options schema for orchestration
export const orchestrationOptionsSchema = z.object({
  enableSummarization: z.boolean().optional().default(true),
  enableRAG: z.boolean().optional().default(true),
  enablePIIRedaction: z.boolean().optional().default(true),
  maxRagResults: z.number().int().min(1).max(20).optional(),
  templateName: z.string().optional(),
}).strict();

// Upgrade prompt request schema
export const upgradePromptSchema = z.object({
  userPrompt: z.string()
    .min(1, 'User prompt is required')
    .max(10000, 'User prompt is too long (max 10,000 characters)'),
  conversationHistory: z.array(messageSchema).optional(),
  userId: z.string().optional(),
  conversationId: z.string().optional(),
  options: orchestrationOptionsSchema.optional(),
}).strict();

// Stats query schema
export const statsQuerySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Prompt template creation schema
export const createPromptTemplateSchema = z.object({
  name: z.string().min(1).max(100, 'Name is too long'),
  description: z.string().max(500).optional(),
  content: z.string().min(1, 'Content is required'),
  variables: z.array(z.string()).optional(),
  promptType: z.enum(['SUMMARIZER', 'UPGRADER', 'RAG_QUERY', 'CUSTOM']),
}).strict();

// Prompt template update schema
export const updatePromptTemplateSchema = z.object({
  description: z.string().max(500).optional(),
  variables: z.array(z.string()).optional(),
}).strict();

// Prompt rollout schema
export const rolloutPromptSchema = z.object({
  promptTemplateId: z.string().cuid('Invalid prompt template ID'),
  targetStage: z.enum(['CANARY_5', 'CANARY_25', 'CANARY_50', 'PRODUCTION']).optional(),
}).strict();

// Eval dataset creation schema
export const createEvalDatasetSchema = z.object({
  name: z.string().min(1, 'Dataset name is required').max(100),
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
}).strict();

// Eval question creation schema
export const createEvalQuestionSchema = z.object({
  datasetId: z.string().cuid('Invalid dataset ID'),
  question: z.string().min(1, 'Question is required').max(5000),
  expectedAnswer: z.string().max(10000).optional(),
  metadata: z.record(z.any()).optional(),
}).strict();

// Run eval schema
export const runEvalSchema = z.object({
  datasetId: z.string().cuid('Invalid dataset ID'),
  runType: z.enum(['ON_DEMAND', 'NIGHTLY', 'PRE_DEPLOY']).optional(),
}).strict();

// Export type inference
export type UpgradePromptRequest = z.infer<typeof upgradePromptSchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type CreatePromptTemplateRequest = z.infer<typeof createPromptTemplateSchema>;
export type UpdatePromptTemplateRequest = z.infer<typeof updatePromptTemplateSchema>;
export type RolloutPromptRequest = z.infer<typeof rolloutPromptSchema>;
export type CreateEvalDatasetRequest = z.infer<typeof createEvalDatasetSchema>;
export type CreateEvalQuestionRequest = z.infer<typeof createEvalQuestionSchema>;
export type RunEvalRequest = z.infer<typeof runEvalSchema>;
