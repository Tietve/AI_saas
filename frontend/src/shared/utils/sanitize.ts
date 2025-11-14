import DOMPurify from 'dompurify';

/**
 * Security utilities for input sanitization and XSS prevention
 */

// Configuration for DOMPurify
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
    'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * Used for rendering AI responses that may contain HTML
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}

/**
 * Sanitize plain text input (removes all HTML tags)
 * Used for user input before sending to API
 */
export function sanitizePlainText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Validate and sanitize chat message
 * Returns sanitized message or throws error
 */
export function validateChatMessage(message: string): string {
  // Remove leading/trailing whitespace
  const trimmed = message.trim();

  // Check if empty
  if (!trimmed) {
    throw new Error('Message cannot be empty');
  }

  // Check length limits
  const MIN_LENGTH = 1;
  const MAX_LENGTH = 10000; // 10k characters

  if (trimmed.length < MIN_LENGTH) {
    throw new Error('Message is too short');
  }

  if (trimmed.length > MAX_LENGTH) {
    throw new Error(`Message is too long (max ${MAX_LENGTH} characters)`);
  }

  // Sanitize the message
  return sanitizePlainText(trimmed);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return '';
  }

  // Only allow http, https, mailto
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('mailto:') &&
    !trimmed.startsWith('/')
  ) {
    return '';
  }

  return url;
}

/**
 * Escape special characters for safe display
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Check for potential SQL injection patterns (client-side validation)
 */
export function hasSqlInjectionPattern(input: string): boolean {
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(;.*--)/, // SQL comment
    /(\bOR\b.*=.*)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check for potential XSS patterns
 */
export function hasXssPattern(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // on* event handlers
    /<embed\b/gi,
    /<object\b/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive input validation
 * Returns { valid: boolean, message?: string }
 */
export function validateInput(input: string, type: 'message' | 'email' | 'url' = 'message'): {
  valid: boolean;
  message?: string;
} {
  // Check for XSS patterns
  if (hasXssPattern(input)) {
    return {
      valid: false,
      message: 'Input contains potentially harmful content',
    };
  }

  // Check for SQL injection (extra safety, backend should handle this)
  if (hasSqlInjectionPattern(input)) {
    return {
      valid: false,
      message: 'Input contains potentially harmful patterns',
    };
  }

  // Type-specific validation
  switch (type) {
    case 'email':
      if (!validateEmail(input)) {
        return { valid: false, message: 'Invalid email format' };
      }
      break;

    case 'url':
      if (!sanitizeUrl(input)) {
        return { valid: false, message: 'Invalid or unsafe URL' };
      }
      break;

    case 'message':
      try {
        validateChatMessage(input);
      } catch (error) {
        return {
          valid: false,
          message: error instanceof Error ? error.message : 'Invalid message',
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Rate limiting helper for client-side
 * Prevents spam by limiting actions within time window
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private maxActions: number;
  private windowMs: number;

  constructor(maxActions: number, windowMs: number) {
    this.maxActions = maxActions;
    this.windowMs = windowMs;
  }

  canPerformAction(): boolean {
    const now = Date.now();
    // Remove old timestamps outside the window
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs);

    if (this.timestamps.length >= this.maxActions) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  reset(): void {
    this.timestamps = [];
  }
}
