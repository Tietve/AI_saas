/**
 * Centralized Zod validation schemas for API routes
 *
 * Best practices:
 * - All API inputs must be validated
 * - Use strict parsing (no .passthrough())
 * - Provide clear error messages
 * - Use transforms for data normalization
 */

import { z } from 'zod'
import { ModelId, PlanTier } from '@prisma/client'

// ==========================================
// COMMON SCHEMAS
// ==========================================

/**
 * Email validation with normalization
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(3, 'Email must be at least 3 characters')
  .max(255, 'Email must be less than 255 characters')
  .transform((email) => email.toLowerCase().trim())

/**
 * Password validation
 */
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters')

/**
 * UUID validation
 */
export const uuidSchema = z.string().regex(/^[a-z0-9_-]+$/i, 'Invalid ID format')

/**
 * Model ID validation
 */
export const modelIdSchema = z.nativeEnum(ModelId, {
  errorMap: () => ({ message: 'Invalid model ID' }),
})

/**
 * Plan tier validation
 */
export const planTierSchema = z.nativeEnum(PlanTier, {
  errorMap: () => ({ message: 'Invalid plan tier' }),
})

// ==========================================
// AUTH SCHEMAS
// ==========================================

/**
 * Sign up request
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type SignupInput = z.infer<typeof signupSchema>

/**
 * Sign in request
 */
export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type SigninInput = z.infer<typeof signinSchema>

/**
 * Forgot password request
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Reset password request
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Verify email request
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

// ==========================================
// CHAT SCHEMAS
// ==========================================

/**
 * Attachment schema
 */
export const attachmentSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(['image', 'file', 'pdf', 'document']).optional(),
  url: z.string().url('Invalid attachment URL'),
  meta: z.record(z.unknown()).optional(),
})

export type AttachmentInput = z.infer<typeof attachmentSchema>

/**
 * Chat send request
 */
export const chatSendSchema = z.object({
  conversationId: z.string().optional(),
  content: z
    .string()
    .max(8000, 'Message content must be less than 8000 characters')
    .optional(),
  model: z.string().optional(),
  requestId: z.string().optional(),
  systemPrompt: z.string().max(2000, 'System prompt must be less than 2000 characters').optional(),
  botId: z.string().optional(),
  attachments: z.array(attachmentSchema).max(10, 'Maximum 10 attachments allowed').optional(),
})
  .refine(
    (data) => {
      // At least content or attachments must be provided
      return (data.content && data.content.trim().length > 0) || (data.attachments && data.attachments.length > 0)
    },
    {
      message: 'Either content or attachments must be provided',
    }
  )

export type ChatSendInput = z.infer<typeof chatSendSchema>

/**
 * Stream chat request
 */
export const chatStreamSchema = chatSendSchema

export type ChatStreamInput = z.infer<typeof chatStreamSchema>

// ==========================================
// CONVERSATION SCHEMAS
// ==========================================

/**
 * Create conversation request
 */
export const createConversationSchema = z.object({
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
  model: modelIdSchema.optional(),
  systemPrompt: z.string().max(2000, 'System prompt must be less than 2000 characters').optional(),
  botId: z.string().optional(),
  projectId: z.string().optional(),
})

export type CreateConversationInput = z.infer<typeof createConversationSchema>

/**
 * Update conversation request
 */
export const updateConversationSchema = z.object({
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
  systemPrompt: z.string().max(2000, 'System prompt must be less than 2000 characters').optional(),
  model: modelIdSchema.optional(),
  pinned: z.boolean().optional(),
  projectId: z.string().nullable().optional(),
})

export type UpdateConversationInput = z.infer<typeof updateConversationSchema>

/**
 * Rename conversation request
 */
export const renameConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
})

export type RenameConversationInput = z.infer<typeof renameConversationSchema>

/**
 * Pin conversation request
 */
export const pinConversationSchema = z.object({
  pinned: z.boolean(),
})

export type PinConversationInput = z.infer<typeof pinConversationSchema>

// ==========================================
// PROJECT SCHEMAS
// ==========================================

/**
 * Create project request
 */
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  color: z.string().max(20, 'Color must be less than 20 characters').optional(),
  icon: z.string().max(50, 'Icon must be less than 50 characters').optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

/**
 * Update project request
 */
export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').nullable().optional(),
  color: z.string().max(20, 'Color must be less than 20 characters').nullable().optional(),
  icon: z.string().max(50, 'Icon must be less than 50 characters').nullable().optional(),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

// ==========================================
// PAYMENT SCHEMAS
// ==========================================

/**
 * Create payment request
 */
export const createPaymentSchema = z.object({
  planTier: planTierSchema,
  returnUrl: z.string().url('Invalid return URL').optional(),
  cancelUrl: z.string().url('Invalid cancel URL').optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>

/**
 * PayOS webhook payload
 */
export const payosWebhookSchema = z.object({
  code: z.string(),
  desc: z.string(),
  data: z.object({
    orderCode: z.number(),
    amount: z.number(),
    description: z.string(),
    accountNumber: z.string().optional(),
    reference: z.string().optional(),
    transactionDateTime: z.string().optional(),
    currency: z.string().optional(),
    paymentLinkId: z.string().optional(),
    code: z.string().optional(),
    desc: z.string().optional(),
    counterAccountBankId: z.string().optional(),
    counterAccountBankName: z.string().optional(),
    counterAccountName: z.string().optional(),
    counterAccountNumber: z.string().optional(),
    virtualAccountName: z.string().optional(),
    virtualAccountNumber: z.string().optional(),
  }),
  signature: z.string(),
})

export type PayosWebhookPayload = z.infer<typeof payosWebhookSchema>

// ==========================================
// FEEDBACK SCHEMAS
// ==========================================

/**
 * Message feedback request
 */
export const messageFeedbackSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  conversationId: z.string().optional(),
  feedback: z.enum(['like', 'dislike'], {
    errorMap: () => ({ message: 'Feedback must be either "like" or "dislike"' }),
  }),
})

export type MessageFeedbackInput = z.infer<typeof messageFeedbackSchema>

// ==========================================
// IMAGE GENERATION SCHEMAS
// ==========================================

/**
 * Image generation request
 */
export const imageGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt must be less than 1000 characters'),
  size: z.enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  style: z.enum(['vivid', 'natural']).optional(),
  n: z.number().int().min(1).max(10).optional(),
})

export type ImageGenerationInput = z.infer<typeof imageGenerationSchema>

// ==========================================
// UPLOAD SCHEMAS
// ==========================================

/**
 * File upload validation (for FormData)
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  conversationId: z.string().optional(),
})

export type FileUploadInput = z.infer<typeof fileUploadSchema>
