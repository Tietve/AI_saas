import { describe, it, expect } from 'vitest';
import type { Message } from '@/features/chat/components/MessageItem';
import {
  estimateFileSize,
  type ExportOptions,
} from '../export';

// Mock data
const mockMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    tokenCount: 5,
    isPinned: false,
  },
  {
    id: '2',
    role: 'assistant',
    content: 'I am doing well, thank you! How can I help you today?',
    timestamp: new Date('2024-01-01T10:00:05Z'),
    tokenCount: 12,
    isPinned: true,
  },
];

const mockOptions: ExportOptions = {
  conversationTitle: 'Test Conversation',
  messages: mockMessages,
  model: 'gpt-4',
  createdAt: '2024-01-01T09:00:00Z',
  totalTokens: 17,
};

describe('Export Utilities', () => {
  describe('estimateFileSize', () => {
    it('should estimate text file size', () => {
      const size = estimateFileSize(mockOptions, 'txt');
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should estimate markdown file size', () => {
      const size = estimateFileSize(mockOptions, 'md');
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate JSON file size', () => {
      const size = estimateFileSize(mockOptions, 'json');
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate HTML file size with overhead', () => {
      const htmlSize = estimateFileSize(mockOptions, 'html');
      const txtSize = estimateFileSize(mockOptions, 'txt');

      // HTML should be larger due to tags
      expect(htmlSize).toBeGreaterThanOrEqual(txtSize);
    });

    it('should return size in KB (rounded up)', () => {
      const size = estimateFileSize(mockOptions, 'txt');

      // Should be whole number (ceiling)
      expect(size).toBe(Math.ceil(size));
    });

    it('should handle empty messages', () => {
      const emptyOptions: ExportOptions = {
        conversationTitle: 'Empty',
        messages: [],
      };

      const size = estimateFileSize(emptyOptions, 'txt');
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it('should handle large conversations', () => {
      const largeMessages: Message[] = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: `${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: 'A'.repeat(1000), // 1000 chars each
          timestamp: new Date(),
          isPinned: false,
        }));

      const largeOptions: ExportOptions = {
        conversationTitle: 'Large',
        messages: largeMessages,
      };

      const size = estimateFileSize(largeOptions, 'txt');
      // 100 messages * 1000 chars ≈ 100KB
      expect(size).toBeGreaterThan(50);
    });
  });
});
