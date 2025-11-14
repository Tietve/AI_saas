import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeHtml,
  sanitizePlainText,
  validateChatMessage,
  validateEmail,
  sanitizeUrl,
  escapeHtml,
  hasSqlInjectionPattern,
  hasXssPattern,
  validateInput,
  RateLimiter,
} from '../sanitize';

describe('sanitizeHtml', () => {
  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
  });

  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Hello</p>');
  });

  it('should remove iframe tags', () => {
    const input = '<p>Content</p><iframe src="evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<iframe>');
  });

  it('should remove event handlers', () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
  });

  it('should allow safe links', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<a');
    expect(result).toContain('href');
  });
});

describe('sanitizePlainText', () => {
  it('should remove all HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizePlainText(input);
    expect(result).toBe('Hello world');
    expect(result).not.toContain('<');
  });

  it('should handle text without HTML', () => {
    const input = 'Plain text message';
    const result = sanitizePlainText(input);
    expect(result).toBe('Plain text message');
  });

  it('should remove script tags completely', () => {
    const input = 'Before<script>alert("xss")</script>After';
    const result = sanitizePlainText(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });
});

describe('validateChatMessage', () => {
  it('should accept valid messages', () => {
    const message = 'This is a valid message';
    const result = validateChatMessage(message);
    expect(result).toBe(message);
  });

  it('should trim whitespace', () => {
    const message = '  Hello  ';
    const result = validateChatMessage(message);
    expect(result).toBe('Hello');
  });

  it('should throw error for empty messages', () => {
    expect(() => validateChatMessage('')).toThrow('Message cannot be empty');
    expect(() => validateChatMessage('   ')).toThrow('Message cannot be empty');
  });

  it('should throw error for too long messages', () => {
    const longMessage = 'a'.repeat(10001);
    expect(() => validateChatMessage(longMessage)).toThrow('Message is too long');
  });

  it('should sanitize HTML in messages', () => {
    const message = '<script>alert("xss")</script>Hello';
    const result = validateChatMessage(message);
    expect(result).not.toContain('<script>');
  });

  it('should accept messages with special characters', () => {
    const message = 'Hello! How are you? 你好 😊';
    const result = validateChatMessage(message);
    expect(result).toContain('Hello');
  });
});

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
    expect(validateEmail('name+tag@email.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('invalid@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user @domain.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('sanitizeUrl', () => {
  it('should allow http and https URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('should allow mailto links', () => {
    expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
  });

  it('should allow relative URLs', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
  });

  it('should block javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
  });

  it('should block data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should block vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:alert(1)')).toBe('');
  });

  it('should block file: protocol', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });

  it('should trim whitespace before checking', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('  https://example.com  ');
  });
});

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should escape ampersands', () => {
    const result = escapeHtml('Tom & Jerry');
    expect(result).toContain('&amp;');
  });

  it('should handle plain text', () => {
    const text = 'Hello World';
    expect(escapeHtml(text)).toBe(text);
  });
});

describe('hasSqlInjectionPattern', () => {
  it('should detect UNION SELECT', () => {
    expect(hasSqlInjectionPattern('UNION SELECT * FROM users')).toBe(true);
    expect(hasSqlInjectionPattern('union select password from users')).toBe(true);
  });

  it('should detect SELECT FROM', () => {
    expect(hasSqlInjectionPattern('SELECT * FROM users')).toBe(true);
  });

  it('should detect INSERT INTO', () => {
    expect(hasSqlInjectionPattern('INSERT INTO users VALUES')).toBe(true);
  });

  it('should detect DELETE FROM', () => {
    expect(hasSqlInjectionPattern('DELETE FROM users')).toBe(true);
  });

  it('should detect DROP TABLE', () => {
    expect(hasSqlInjectionPattern('DROP TABLE users')).toBe(true);
  });

  it('should detect UPDATE SET', () => {
    expect(hasSqlInjectionPattern('UPDATE users SET password')).toBe(true);
  });

  it('should detect SQL comments', () => {
    expect(hasSqlInjectionPattern("'; --")).toBe(true);
  });

  it('should detect OR equals patterns', () => {
    expect(hasSqlInjectionPattern("' OR '1'='1")).toBe(true);
  });

  it('should not flag normal text', () => {
    expect(hasSqlInjectionPattern('Hello world')).toBe(false);
    expect(hasSqlInjectionPattern('I want to select a book')).toBe(false);
  });
});

describe('hasXssPattern', () => {
  it('should detect script tags', () => {
    expect(hasXssPattern('<script>alert(1)</script>')).toBe(true);
    expect(hasXssPattern('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
  });

  it('should detect iframe tags', () => {
    expect(hasXssPattern('<iframe src="evil.com"></iframe>')).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    expect(hasXssPattern('javascript:alert(1)')).toBe(true);
    expect(hasXssPattern('JAVASCRIPT:void(0)')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(hasXssPattern('onclick=alert(1)')).toBe(true);
    expect(hasXssPattern('onload=malicious()')).toBe(true);
    expect(hasXssPattern('onerror=hack()')).toBe(true);
  });

  it('should detect embed tags', () => {
    expect(hasXssPattern('<embed src="malware.swf">')).toBe(true);
  });

  it('should detect object tags', () => {
    expect(hasXssPattern('<object data="evil.swf">')).toBe(true);
  });

  it('should not flag normal text', () => {
    expect(hasXssPattern('Hello world')).toBe(false);
    expect(hasXssPattern('Click here to continue')).toBe(false);
  });
});

describe('validateInput', () => {
  describe('message type', () => {
    it('should validate clean messages', () => {
      const result = validateInput('Hello world', 'message');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should reject XSS patterns', () => {
      const result = validateInput('<script>alert(1)</script>', 'message');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('harmful content');
    });

    it('should reject SQL injection patterns', () => {
      const result = validateInput("' OR '1'='1", 'message');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('harmful patterns');
    });

    it('should reject empty messages', () => {
      const result = validateInput('', 'message');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Message cannot be empty');
    });
  });

  describe('email type', () => {
    it('should validate correct emails', () => {
      const result = validateInput('user@example.com', 'email');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid emails', () => {
      const result = validateInput('invalid-email', 'email');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid email format');
    });
  });

  describe('url type', () => {
    it('should validate safe URLs', () => {
      const result = validateInput('https://example.com', 'url');
      expect(result.valid).toBe(true);
    });

    it('should reject dangerous URLs with XSS patterns', () => {
      const result = validateInput('javascript:alert(1)', 'url');
      expect(result.valid).toBe(false);
      // XSS check happens before URL check
      expect(result.message).toContain('harmful content');
    });

    it('should reject invalid protocol URLs', () => {
      const result = validateInput('ftp://example.com', 'url');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid or unsafe URL');
    });
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should allow actions within limit', () => {
    const limiter = new RateLimiter(3, 1000); // 3 actions per second
    expect(limiter.canPerformAction()).toBe(true);
    expect(limiter.canPerformAction()).toBe(true);
    expect(limiter.canPerformAction()).toBe(true);
  });

  it('should block actions exceeding limit', () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.canPerformAction()).toBe(true);
    expect(limiter.canPerformAction()).toBe(true);
    expect(limiter.canPerformAction()).toBe(false); // Blocked
  });

  it('should reset after time window', () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.canPerformAction()).toBe(true);
    expect(limiter.canPerformAction()).toBe(true);
    expect(limiter.canPerformAction()).toBe(false);

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);

    // Should allow again
    expect(limiter.canPerformAction()).toBe(true);
  });

  it('should allow manual reset', () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.canPerformAction()).toBe(true);
    expect(limiter.canPerformAction()).toBe(true);
    expect(limiter.canPerformAction()).toBe(false);

    limiter.reset();

    expect(limiter.canPerformAction()).toBe(true);
  });

  it('should handle sliding window correctly', () => {
    const limiter = new RateLimiter(3, 1000);

    // t=0ms
    expect(limiter.canPerformAction()).toBe(true);

    // t=400ms
    vi.advanceTimersByTime(400);
    expect(limiter.canPerformAction()).toBe(true);

    // t=600ms
    vi.advanceTimersByTime(200);
    expect(limiter.canPerformAction()).toBe(true);
    expect(limiter.canPerformAction()).toBe(false); // 4th action blocked

    // t=1100ms - first action should be out of window
    vi.advanceTimersByTime(500);
    expect(limiter.canPerformAction()).toBe(true);
  });
});
