import logger from '../config/logger.config';

export interface TextChunk {
  content: string;
  index: number;
  startChar: number;
  endChar: number;
  tokenEstimate: number;
}

export interface ChunkingOptions {
  chunkSize?: number; // Target chunk size in tokens (default: 512)
  overlapPercent?: number; // Overlap percentage (default: 20%)
  minChunkSize?: number; // Minimum chunk size in tokens (default: 100)
}

export class ChunkingService {
  private readonly DEFAULT_CHUNK_SIZE = 512;
  private readonly DEFAULT_OVERLAP_PERCENT = 20;
  private readonly DEFAULT_MIN_CHUNK_SIZE = 100;
  private readonly AVG_CHARS_PER_TOKEN = 4; // Rough estimate for English text

  /**
   * Split text into overlapping chunks
   * @param text - Full text to chunk
   * @param options - Chunking configuration
   * @returns Array of text chunks
   */
  public chunkText(text: string, options: ChunkingOptions = {}): TextChunk[] {
    const {
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      overlapPercent = this.DEFAULT_OVERLAP_PERCENT,
      minChunkSize = this.DEFAULT_MIN_CHUNK_SIZE,
    } = options;

    logger.info(`[Chunking] Starting text chunking: ${text.length} chars, target chunk size: ${chunkSize} tokens`);

    // Convert token sizes to character estimates
    const chunkSizeChars = chunkSize * this.AVG_CHARS_PER_TOKEN;
    const overlapChars = Math.floor((chunkSizeChars * overlapPercent) / 100);
    const minChunkSizeChars = minChunkSize * this.AVG_CHARS_PER_TOKEN;

    const chunks: TextChunk[] = [];
    let startPos = 0;
    let chunkIndex = 0;

    while (startPos < text.length) {
      let endPos = Math.min(startPos + chunkSizeChars, text.length);

      // Try to break at sentence boundaries for better semantic coherence
      if (endPos < text.length) {
        const breakPos = this.findSentenceBreak(text, endPos, startPos);
        if (breakPos > startPos + minChunkSizeChars) {
          endPos = breakPos;
        }
      }

      const chunkContent = text.substring(startPos, endPos).trim();

      // Only add non-empty chunks
      if (chunkContent.length > 0) {
        chunks.push({
          content: chunkContent,
          index: chunkIndex,
          startChar: startPos,
          endChar: endPos,
          tokenEstimate: Math.ceil(chunkContent.length / this.AVG_CHARS_PER_TOKEN),
        });
        chunkIndex++;
      }

      // Move start position forward with overlap
      startPos = endPos - overlapChars;

      // Prevent infinite loop if chunk is too small
      if (startPos <= chunks[chunks.length - 1]?.startChar) {
        startPos = endPos;
      }
    }

    logger.info(`[Chunking] Created ${chunks.length} chunks from ${text.length} characters`);

    return chunks;
  }

  /**
   * Find a good sentence break point near the target position
   * @param text - Full text
   * @param targetPos - Target position to break at
   * @param minPos - Minimum position (don't go before this)
   * @returns Best break position
   */
  private findSentenceBreak(text: string, targetPos: number, minPos: number): number {
    const searchRadius = 100; // Look 100 chars before and after target
    const searchStart = Math.max(minPos, targetPos - searchRadius);
    const searchEnd = Math.min(text.length, targetPos + searchRadius);
    const searchText = text.substring(searchStart, searchEnd);

    // Look for sentence endings: period, exclamation, question mark followed by space
    const sentenceEndPattern = /[.!?]\s+/g;
    let bestBreak = targetPos;
    let minDistance = Infinity;

    let match;
    while ((match = sentenceEndPattern.exec(searchText)) !== null) {
      const breakPos = searchStart + match.index + match[0].length;
      const distance = Math.abs(breakPos - targetPos);

      if (distance < minDistance && breakPos > minPos) {
        minDistance = distance;
        bestBreak = breakPos;
      }
    }

    // If no sentence break found, try paragraph breaks
    if (bestBreak === targetPos) {
      const paragraphPattern = /\n\n+/g;
      while ((match = paragraphPattern.exec(searchText)) !== null) {
        const breakPos = searchStart + match.index + match[0].length;
        const distance = Math.abs(breakPos - targetPos);

        if (distance < minDistance && breakPos > minPos) {
          minDistance = distance;
          bestBreak = breakPos;
        }
      }
    }

    // If still no break found, try single newlines
    if (bestBreak === targetPos) {
      const newlinePattern = /\n/g;
      while ((match = newlinePattern.exec(searchText)) !== null) {
        const breakPos = searchStart + match.index + match[0].length;
        const distance = Math.abs(breakPos - targetPos);

        if (distance < minDistance && breakPos > minPos) {
          minDistance = distance;
          bestBreak = breakPos;
        }
      }
    }

    return bestBreak;
  }

  /**
   * Get chunking statistics
   * @param chunks - Array of chunks
   * @returns Statistics object
   */
  public getChunkStats(chunks: TextChunk[]) {
    const tokenCounts = chunks.map((c) => c.tokenEstimate);
    const charCounts = chunks.map((c) => c.content.length);

    return {
      totalChunks: chunks.length,
      avgTokens: Math.round(tokenCounts.reduce((a, b) => a + b, 0) / chunks.length),
      minTokens: Math.min(...tokenCounts),
      maxTokens: Math.max(...tokenCounts),
      avgChars: Math.round(charCounts.reduce((a, b) => a + b, 0) / chunks.length),
      totalTokens: tokenCounts.reduce((a, b) => a + b, 0),
    };
  }
}

// Export singleton instance
export const chunkingService = new ChunkingService();
