import { PIIPattern, PIIType, RedactionResult, PIIConfig } from '../types/pii.types';
import logger from '../config/logger.config';
import crypto from 'crypto';

// PII Detection Patterns
const PII_PATTERNS: PIIPattern[] = [
  {
    type: PIIType.EMAIL,
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]',
  },
  {
    type: PIIType.PHONE,
    regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: '[PHONE_REDACTED]',
  },
  {
    type: PIIType.SSN,
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN_REDACTED]',
  },
  {
    type: PIIType.CREDIT_CARD,
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CC_REDACTED]',
  },
  {
    type: PIIType.IP_ADDRESS,
    regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '[IP_REDACTED]',
  },
];

export class PIIRedactionService {
  private config: PIIConfig;
  private encryptionKey: string;

  constructor(config?: PIIConfig) {
    this.config = config || {
      enabledTypes: Object.values(PIIType),
    };

    // Use environment variable or generate random key
    this.encryptionKey = process.env.PII_ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  /**
   * Redact PII from text
   */
  public redact(text: string): RedactionResult {
    let redactedText = text;
    const piiFound: Set<PIIType> = new Set();
    const redactionMap: Record<string, string> = {};

    // Get applicable patterns
    const patterns = this.getApplicablePatterns();

    // Apply each pattern
    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);

      if (matches && matches.length > 0) {
        piiFound.add(pattern.type);

        // Replace each match with unique placeholder
        matches.forEach((match, index) => {
          const placeholder = `${pattern.replacement}_${index}`;

          // Encrypt original value
          const encrypted = this.encrypt(match);
          redactionMap[placeholder] = encrypted;

          // Replace in text
          redactedText = redactedText.replace(match, placeholder);
        });

        logger.info(`[PII] Redacted ${matches.length} instances of ${pattern.type}`);
      }
    }

    return {
      redactedText,
      piiFound: Array.from(piiFound),
      redactionMap,
      originalText: text,
    };
  }

  /**
   * Restore PII in text
   */
  public restore(redactedText: string, redactionMap: Record<string, string>): string {
    let restoredText = redactedText;

    for (const [placeholder, encrypted] of Object.entries(redactionMap)) {
      try {
        const original = this.decrypt(encrypted);
        restoredText = restoredText.replace(placeholder, original);
      } catch (error) {
        logger.error(`[PII] Failed to restore placeholder ${placeholder}:`, error);
      }
    }

    return restoredText;
  }

  /**
   * Check if text contains PII
   */
  public containsPII(text: string): boolean {
    const patterns = this.getApplicablePatterns();

    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get types of PII found in text
   */
  public detectPIITypes(text: string): PIIType[] {
    const piiTypes: Set<PIIType> = new Set();
    const patterns = this.getApplicablePatterns();

    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        piiTypes.add(pattern.type);
      }
    }

    return Array.from(piiTypes);
  }

  /**
   * Get applicable patterns based on config
   */
  private getApplicablePatterns(): PIIPattern[] {
    const patterns = PII_PATTERNS.filter(p =>
      this.config.enabledTypes.includes(p.type)
    );

    // Add custom patterns if any
    if (this.config.customPatterns) {
      patterns.push(...this.config.customPatterns);
    }

    return patterns;
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
export const piiRedactionService = new PIIRedactionService();
