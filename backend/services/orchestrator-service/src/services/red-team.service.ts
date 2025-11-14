import logger from '../config/logger.config';

export interface PIIDetectionResult {
  detected: boolean;
  types: string[];
  matches: string[];
}

export interface InjectionDetectionResult {
  detected: boolean;
  confidence: number;
  matchedKeywords: string[];
}

/**
 * Red Team Service
 * Detects security issues: PII leaks, prompt injection, harmful content
 */
export class RedTeamService {
  // PII detection patterns
  private readonly PII_PATTERNS = {
    email: {
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      name: 'email',
    },
    phone: {
      regex: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      name: 'phone',
    },
    ssn: {
      regex: /\b\d{3}-\d{2}-\d{4}\b/g,
      name: 'ssn',
    },
    creditCard: {
      regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      name: 'creditCard',
    },
    ipAddress: {
      regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      name: 'ipAddress',
    },
  };

  // Prompt injection keywords
  private readonly INJECTION_KEYWORDS = [
    'ignore previous instructions',
    'disregard above',
    'forget everything',
    'new instructions:',
    'system:',
    'override:',
    'reset instructions',
    'ignore all previous',
    'disregard all previous',
    'forget all previous',
    'new directive:',
    'admin command:',
    'bypass instructions',
  ];

  /**
   * Detect PII in text
   */
  public detectPIILeak(text: string): PIIDetectionResult {
    const types: string[] = [];
    const matches: string[] = [];

    for (const [key, pattern] of Object.entries(this.PII_PATTERNS)) {
      const found = text.match(pattern.regex);
      if (found && found.length > 0) {
        types.push(pattern.name);
        matches.push(...found);
      }
    }

    const detected = types.length > 0;

    if (detected) {
      logger.warn(`[RedTeam] PII leak detected: ${types.join(', ')}`);
    }

    return {
      detected,
      types,
      matches,
    };
  }

  /**
   * Detect prompt injection attempts
   */
  public detectInjection(
    userPrompt: string,
    upgradedPrompt: string
  ): InjectionDetectionResult {
    const combined = `${userPrompt.toLowerCase()} ${upgradedPrompt.toLowerCase()}`;
    const matchedKeywords: string[] = [];

    for (const keyword of this.INJECTION_KEYWORDS) {
      if (combined.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    const detected = matchedKeywords.length > 0;
    const confidence = Math.min(matchedKeywords.length * 0.3, 1.0); // Max 1.0

    if (detected) {
      logger.warn(
        `[RedTeam] Injection detected (confidence: ${confidence.toFixed(2)}): ` +
        `${matchedKeywords.join(', ')}`
      );
    }

    return {
      detected,
      confidence,
      matchedKeywords,
    };
  }

  /**
   * Check if upgraded prompt significantly deviates from user intent
   * (Simple heuristic: check length ratio)
   */
  public detectDeviation(userPrompt: string, upgradedPrompt: string): boolean {
    const userLength = userPrompt.length;
    const upgradedLength = upgradedPrompt.length;

    // If upgraded prompt is >10x longer, might be suspicious
    const ratio = upgradedLength / userLength;

    if (ratio > 10) {
      logger.warn(`[RedTeam] Large deviation detected: ${ratio.toFixed(1)}x longer`);
      return true;
    }

    return false;
  }

  /**
   * Run all red-team checks
   */
  public runAllChecks(userPrompt: string, upgradedPrompt: string, context?: string) {
    const fullText = `${upgradedPrompt} ${context || ''}`;

    const piiLeak = this.detectPIILeak(fullText);
    const injection = this.detectInjection(userPrompt, upgradedPrompt);
    const deviation = this.detectDeviation(userPrompt, upgradedPrompt);

    const issuesDetected =
      piiLeak.detected || injection.detected || deviation;

    logger.info(
      `[RedTeam] Checks complete - ` +
      `PII: ${piiLeak.detected}, ` +
      `Injection: ${injection.detected}, ` +
      `Deviation: ${deviation}`
    );

    return {
      piiLeak,
      injection,
      deviation,
      passed: !issuesDetected,
    };
  }
}

// Export singleton
export const redTeamService = new RedTeamService();
