/**
 * Chunking Service
 *
 * Splits text into semantic chunks with token limits and overlap
 */

import { Chunk, ChunkingOptions } from '../types/document.types';
import { TokenCounter } from '../utils/token-counter';

export class ChunkingService {
  private tokenCounter: TokenCounter;

  constructor() {
    this.tokenCounter = new TokenCounter('gpt-4');
  }

  /**
   * Chunk text into segments with token limits and overlap
   * @param text Full text to chunk
   * @param options Chunking configuration
   * @returns Array of chunks with metadata
   */
  async chunkText(text: string, options: ChunkingOptions = {}): Promise<Chunk[]> {
    const {
      maxTokens = 512,
      overlapPercentage = 20,
      preserveSentences = true,
    } = options;

    // Calculate overlap in tokens
    const overlapTokens = Math.floor(maxTokens * (overlapPercentage / 100));

    // Split into paragraphs first (preserve document structure)
    const paragraphs = this.splitIntoParagraphs(text);

    const chunks: Chunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = this.tokenCounter.count(paragraph);

      // If single paragraph exceeds max tokens, split it
      if (paragraphTokens > maxTokens) {
        // Save current chunk if not empty
        if (currentChunk.trim()) {
          chunks.push(this.createChunk(currentChunk.trim(), chunkIndex++));
          currentChunk = '';
          currentTokens = 0;
        }

        // Split large paragraph
        const largeParagraphChunks = this.splitLargeParagraph(
          paragraph,
          maxTokens,
          overlapTokens,
          preserveSentences
        );

        for (const chunk of largeParagraphChunks) {
          chunks.push(this.createChunk(chunk, chunkIndex++));
        }

        continue;
      }

      // Check if adding this paragraph exceeds max tokens
      if (currentTokens + paragraphTokens > maxTokens) {
        // Save current chunk
        if (currentChunk.trim()) {
          chunks.push(this.createChunk(currentChunk.trim(), chunkIndex++));
        }

        // Start new chunk with overlap
        if (overlapTokens > 0 && chunks.length > 0) {
          currentChunk = this.getOverlapText(currentChunk, overlapTokens);
          currentTokens = this.tokenCounter.count(currentChunk);
        } else {
          currentChunk = '';
          currentTokens = 0;
        }
      }

      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentTokens += paragraphTokens;
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(this.createChunk(currentChunk.trim(), chunkIndex));
    }

    return chunks;
  }

  /**
   * Split text into paragraphs (double newline separator)
   */
  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\n+/) // Split on double newlines
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  /**
   * Split large paragraph that exceeds max tokens
   */
  private splitLargeParagraph(
    paragraph: string,
    maxTokens: number,
    overlapTokens: number,
    preserveSentences: boolean
  ): string[] {
    if (preserveSentences) {
      return this.splitBySentences(paragraph, maxTokens, overlapTokens);
    } else {
      return this.splitByTokens(paragraph, maxTokens, overlapTokens);
    }
  }

  /**
   * Split text by sentences (preserve sentence boundaries)
   */
  private splitBySentences(
    text: string,
    maxTokens: number,
    overlapTokens: number
  ): string[] {
    const sentences = this.splitIntoSentences(text);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.tokenCounter.count(sentence);

      // If single sentence exceeds max tokens, force split
      if (sentenceTokens > maxTokens) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentTokens = 0;
        }

        // Split by tokens (no choice)
        const forcedSplits = this.splitByTokens(sentence, maxTokens, overlapTokens);
        chunks.push(...forcedSplits);
        continue;
      }

      // Check if adding this sentence exceeds max tokens
      if (currentTokens + sentenceTokens > maxTokens) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // Start new chunk with overlap
        if (overlapTokens > 0 && chunks.length > 0) {
          currentChunk = this.getOverlapText(currentChunk, overlapTokens);
          currentTokens = this.tokenCounter.count(currentChunk);
        } else {
          currentChunk = '';
          currentTokens = 0;
        }
      }

      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentTokens += sentenceTokens;
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Split text into sentences (basic sentence boundary detection)
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence endings: . ! ? followed by space/newline
    // Preserve abbreviations like "Dr.", "Mr.", "U.S."
    const sentences = text
      .replace(/([.!?])\s+/g, '$1|') // Mark sentence boundaries
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return sentences;
  }

  /**
   * Split by pure token count (fallback, doesn't preserve boundaries)
   */
  private splitByTokens(text: string, maxTokens: number, overlapTokens: number): string[] {
    return this.tokenCounter.splitByTokens(text, maxTokens, overlapTokens);
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlapText(text: string, overlapTokens: number): string {
    const tokens = this.tokenCounter.count(text);

    if (tokens <= overlapTokens) {
      return text;
    }

    // Get last N tokens
    const startToken = tokens - overlapTokens;
    const words = text.split(/\s+/);

    // Estimate which words to keep (approximate)
    const wordsPerToken = words.length / tokens;
    const wordsToKeep = Math.ceil(overlapTokens * wordsPerToken);

    return words.slice(-wordsToKeep).join(' ');
  }

  /**
   * Create chunk object with metadata
   */
  private createChunk(content: string, chunkIndex: number): Chunk {
    return {
      content,
      chunkIndex,
      pageNumber: null, // Will be populated later if page tracking is available
      tokens: this.tokenCounter.count(content),
    };
  }

  /**
   * Estimate page number from chunk position (heuristic)
   * Assumes ~500 words per page
   */
  estimatePageNumber(text: string, chunkStartIndex: number): number {
    const textBeforeChunk = text.substring(0, chunkStartIndex);
    const words = textBeforeChunk.split(/\s+/).length;
    const wordsPerPage = 500;

    return Math.floor(words / wordsPerPage) + 1;
  }

  /**
   * Free resources
   */
  destroy(): void {
    this.tokenCounter.free();
  }
}
