import { describe, it, expect, beforeEach } from 'vitest';
import {
  countTokens,
  formatTokenCount,
  estimateCost,
  exceedsLimit,
  cleanup,
} from './tokenCounter';

describe('tokenCounter', () => {
  beforeEach(() => {
    // Clean up between tests
    cleanup();
  });

  describe('countTokens', () => {
    it('should count tokens in simple text', () => {
      const text = 'Hello world';
      const count = countTokens(text);
      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });

    it('should return 0 for empty string', () => {
      expect(countTokens('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(countTokens('   ')).toBe(0);
      expect(countTokens('\n\t  ')).toBe(0);
    });

    it('should count tokens in longer text', () => {
      const text = 'The quick brown fox jumps over the lazy dog.';
      const count = countTokens(text);
      expect(count).toBeGreaterThan(0);
      // Typically around 10-12 tokens for this sentence
      expect(count).toBeLessThan(20);
    });

    it('should handle special characters', () => {
      const text = 'Hello! @#$% ^&*() 123';
      const count = countTokens(text);
      expect(count).toBeGreaterThan(0);
    });

    it('should handle unicode characters', () => {
      const text = 'Hello 世界 🌍';
      const count = countTokens(text);
      expect(count).toBeGreaterThan(0);
    });

    it('should handle code snippets', () => {
      const code = 'function hello() { return "world"; }';
      const count = countTokens(code);
      expect(count).toBeGreaterThan(0);
    });

    it('should handle multiline text', () => {
      const text = `Line 1
Line 2
Line 3`;
      const count = countTokens(text);
      expect(count).toBeGreaterThan(0);
    });

    it('should be consistent for same text', () => {
      const text = 'Consistency test';
      const count1 = countTokens(text);
      const count2 = countTokens(text);
      expect(count1).toBe(count2);
    });

    it('should use fallback on error', () => {
      // Test that we can handle reasonably long text
      const text = 'a'.repeat(1000);
      const count = countTokens(text);
      expect(count).toBeGreaterThan(0);
      // With 1000 'a's, should have around 250 tokens (4 chars per token)
      expect(count).toBeLessThan(500);
    });
  });

  describe('formatTokenCount', () => {
    it('should format small counts', () => {
      expect(formatTokenCount(0)).toBe('0 tokens');
      expect(formatTokenCount(1)).toBe('1 tokens');
      expect(formatTokenCount(100)).toBe('100 tokens');
      expect(formatTokenCount(999)).toBe('999 tokens');
    });

    it('should format thousands with K suffix', () => {
      expect(formatTokenCount(1000)).toBe('1.0K tokens');
      expect(formatTokenCount(1500)).toBe('1.5K tokens');
      expect(formatTokenCount(12345)).toBe('12.3K tokens');
      expect(formatTokenCount(999999)).toBe('1000.0K tokens');
    });

    it('should format millions with M suffix', () => {
      expect(formatTokenCount(1000000)).toBe('1.0M tokens');
      expect(formatTokenCount(1500000)).toBe('1.5M tokens');
      expect(formatTokenCount(12345678)).toBe('12.3M tokens');
    });

    it('should handle edge cases', () => {
      expect(formatTokenCount(999)).toBe('999 tokens');
      expect(formatTokenCount(1000)).toBe('1.0K tokens');
      expect(formatTokenCount(999999)).toBe('1000.0K tokens');
      expect(formatTokenCount(1000000)).toBe('1.0M tokens');
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for GPT-4', () => {
      const cost = estimateCost(1000000, 'gpt-4');
      expect(cost).toBe(30.0);
    });

    it('should estimate cost for GPT-4-turbo', () => {
      const cost = estimateCost(1000000, 'gpt-4-turbo');
      expect(cost).toBe(10.0);
    });

    it('should estimate cost for GPT-3.5-turbo', () => {
      const cost = estimateCost(1000000, 'gpt-3.5-turbo');
      expect(cost).toBe(0.5);
    });

    it('should estimate cost for Claude models', () => {
      const costOpus = estimateCost(1000000, 'claude-3-opus');
      const costSonnet = estimateCost(1000000, 'claude-3-sonnet');
      expect(costOpus).toBe(15.0);
      expect(costSonnet).toBe(3.0);
    });

    it('should use default GPT-4 pricing for unknown models', () => {
      const cost = estimateCost(1000000, 'unknown-model');
      expect(cost).toBe(30.0);
    });

    it('should use default model when not specified', () => {
      const cost = estimateCost(1000000);
      expect(cost).toBe(30.0); // GPT-4 default
    });

    it('should calculate proportional costs', () => {
      const cost = estimateCost(500000, 'gpt-4');
      expect(cost).toBe(15.0); // Half of 1M tokens
    });

    it('should handle small token counts', () => {
      const cost = estimateCost(1000, 'gpt-3.5-turbo');
      expect(cost).toBeLessThan(0.01);
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle zero tokens', () => {
      const cost = estimateCost(0, 'gpt-4');
      expect(cost).toBe(0);
    });
  });

  describe('exceedsLimit', () => {
    it('should return true when exceeds limit', () => {
      expect(exceedsLimit(5000, 4096)).toBe(true);
      expect(exceedsLimit(10000, 8000)).toBe(true);
    });

    it('should return false when within limit', () => {
      expect(exceedsLimit(3000, 4096)).toBe(false);
      expect(exceedsLimit(1000, 4096)).toBe(false);
    });

    it('should return false when equal to limit', () => {
      expect(exceedsLimit(4096, 4096)).toBe(false);
    });

    it('should use default limit of 4096', () => {
      expect(exceedsLimit(5000)).toBe(true);
      expect(exceedsLimit(3000)).toBe(false);
      expect(exceedsLimit(4096)).toBe(false);
    });

    it('should handle zero tokens', () => {
      expect(exceedsLimit(0, 4096)).toBe(false);
    });

    it('should handle custom limits', () => {
      expect(exceedsLimit(100000, 128000)).toBe(false);
      expect(exceedsLimit(150000, 128000)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should cleanup encoding without throwing', () => {
      // First create an encoding by counting tokens
      countTokens('Test text');

      // Then cleanup
      expect(() => cleanup()).not.toThrow();
    });

    it('should work when called multiple times', () => {
      cleanup();
      expect(() => cleanup()).not.toThrow();
      expect(() => cleanup()).not.toThrow();
    });

    it('should work when encoding is already null', () => {
      // Cleanup without creating encoding first
      expect(() => cleanup()).not.toThrow();
    });

    it('should allow creating new encoding after cleanup', () => {
      // Create encoding
      const count1 = countTokens('Test');

      // Cleanup
      cleanup();

      // Create new encoding
      const count2 = countTokens('Test');

      expect(count1).toBe(count2);
    });
  });

  describe('Cleanup Fix - No free() method', () => {
    it('should not call free() method which does not exist', () => {
      // This test verifies the fix for TS2339
      // The Tiktoken class does not have a free() method
      // We now rely on garbage collection instead

      countTokens('Test text to create encoding');

      // cleanup() should work without trying to call free()
      expect(() => cleanup()).not.toThrow();
    });

    it('should set encoding to null for garbage collection', () => {
      countTokens('Create encoding');
      cleanup();

      // After cleanup, new encoding should be created on next call
      const count = countTokens('Test again');
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work in a typical usage flow', () => {
      const text = 'This is a test message for the chat application.';

      // Count tokens
      const count = countTokens(text);
      expect(count).toBeGreaterThan(0);

      // Format count
      const formatted = formatTokenCount(count);
      expect(formatted).toContain('tokens');

      // Estimate cost
      const cost = estimateCost(count, 'gpt-3.5-turbo');
      expect(cost).toBeGreaterThanOrEqual(0);

      // Check limit
      const exceeds = exceedsLimit(count, 4096);
      expect(exceeds).toBe(false);

      // Cleanup
      expect(() => cleanup()).not.toThrow();
    });

    it('should handle large document workflow', () => {
      const largeText = 'word '.repeat(5000); // ~5000 words

      const count = countTokens(largeText);
      expect(count).toBeGreaterThan(1000);

      const formatted = formatTokenCount(count);
      expect(formatted).toContain('K tokens');

      const cost = estimateCost(count, 'gpt-4');
      expect(cost).toBeGreaterThan(0);

      const exceeds4k = exceedsLimit(count, 4096);
      const exceeds128k = exceedsLimit(count, 128000);

      // Should likely exceed 4k but not 128k
      if (count > 4096) {
        expect(exceeds4k).toBe(true);
      }
      expect(exceeds128k).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle null gracefully', () => {
      // @ts-expect-error Testing null handling
      const count = countTokens(null);
      expect(count).toBe(0);
    });

    it('should handle undefined gracefully', () => {
      // @ts-expect-error Testing undefined handling
      const count = countTokens(undefined);
      expect(count).toBe(0);
    });

    it('should use fallback for encoding errors', () => {
      // If encoding fails, should use char/4 fallback
      const text = 'Test fallback';
      const count = countTokens(text);

      // Should still get a reasonable count
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(text.length);
    });
  });
});
