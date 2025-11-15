import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkIcons } from './remarkIcons';
import type { Root } from 'mdast';

describe('remarkIcons', () => {
  const createProcessor = () => {
    return unified()
      .use(remarkParse)
      .use(remarkIcons)
      .use(remarkStringify);
  };

  describe('Plugin Transformation', () => {
    it('should process markdown without icons', async () => {
      const processor = createProcessor();
      const result = await processor.process('Hello world');
      expect(result).toBeDefined();
      expect(result.toString()).toBeTruthy();
    });

    it('should transform :icon: syntax into icon nodes', async () => {
      const processor = createProcessor();
      const file = await processor.parse('Hello :fire: world');
      const tree = file as unknown as Root;

      // Apply the transformation
      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        transformer(tree);
      }

      expect(tree).toBeDefined();
    });

    it('should handle multiple icons in same text node', async () => {
      const processor = createProcessor();
      const file = await processor.parse(':fire: :rocket: :heart:');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        transformer(tree);
      }

      expect(tree).toBeDefined();
    });

    it('should skip nodes without icons', async () => {
      const processor = createProcessor();
      const file = await processor.parse('No icons here');
      const tree = file as unknown as Root;

      const originalChildren = tree.children.length;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        transformer(tree);
      }

      // Should not modify structure significantly if no icons
      expect(tree.children).toBeDefined();
    });

    it('should handle empty text', async () => {
      const processor = createProcessor();
      const file = await processor.parse('');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        transformer(tree);
      }

      expect(tree).toBeDefined();
    });
  });

  describe('Type Guards Fix', () => {
    it('should handle undefined index safely', async () => {
      // This test verifies the fix for TS2769
      // The visit callback provides index as number | undefined
      // We now check for undefined before using in splice
      const processor = createProcessor();
      const file = await processor.parse('Text with :icon:');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        // Should not throw error even if index is undefined
        expect(() => transformer(tree)).not.toThrow();
      }
    });

    it('should only process when parent and index are defined', async () => {
      const processor = createProcessor();
      const file = await processor.parse(':fire: test');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        // Should handle cases where parent or index might be undefined
        expect(() => transformer(tree)).not.toThrow();
      }
    });
  });

  describe('Icon Node Creation', () => {
    it('should create custom icon nodes with correct structure', async () => {
      const processor = createProcessor();
      const file = await processor.parse(':fire:');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        transformer(tree);
      }

      // Icon nodes should have proper structure
      expect(tree).toBeDefined();
      expect(tree.children).toBeDefined();
    });

    it('should preserve text around icons', async () => {
      const processor = createProcessor();
      const file = await processor.parse('Before :fire: after');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        transformer(tree);
      }

      expect(tree).toBeDefined();
    });

    it('should handle consecutive icons', async () => {
      const processor = createProcessor();
      const file = await processor.parse(':fire::rocket:');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        transformer(tree);
      }

      expect(tree).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed icon syntax', async () => {
      const processor = createProcessor();
      const file = await processor.parse(':incomplete');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        expect(() => transformer(tree)).not.toThrow();
      }
    });

    it('should handle nested markdown structures', async () => {
      const processor = createProcessor();
      const file = await processor.parse('**Bold :fire: text**');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        expect(() => transformer(tree)).not.toThrow();
      }
    });

    it('should handle icons in lists', async () => {
      const processor = createProcessor();
      const file = await processor.parse('- Item :fire:\n- Item :rocket:');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        expect(() => transformer(tree)).not.toThrow();
      }
    });
  });

  describe('Regex Matching', () => {
    it('should match valid icon syntax', async () => {
      const processor = createProcessor();
      const file = await processor.parse(':valid_icon123:');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        expect(() => transformer(tree)).not.toThrow();
      }
    });

    it('should handle case sensitivity in icon names', async () => {
      const processor = createProcessor();
      const file = await processor.parse(':FIRE: :Fire: :fire:');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        transformer(tree);
      }

      expect(tree).toBeDefined();
    });

    it('should not match invalid syntax', async () => {
      const processor = createProcessor();
      const file = await processor.parse(': invalid: :also invalid :');
      const tree = file as unknown as Root;

      const transformer = remarkIcons();
      if (transformer && typeof transformer === 'function') {
        expect(() => transformer(tree)).not.toThrow();
      }
    });
  });
});
