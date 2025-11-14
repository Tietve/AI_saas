/**
 * Text Cleaner Utility
 *
 * Cleans and normalizes extracted text from PDFs
 */

export class TextCleaner {
  /**
   * Clean extracted PDF text
   * - Remove excessive whitespace
   * - Normalize line breaks
   * - Remove control characters
   * - Normalize Unicode characters
   */
  static clean(text: string): string {
    let cleaned = text;

    // 1. Remove null bytes and control characters (except newlines, tabs)
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 2. Normalize Unicode (NFC form - canonical composition)
    cleaned = cleaned.normalize('NFC');

    // 3. Replace multiple spaces with single space
    cleaned = cleaned.replace(/ {2,}/g, ' ');

    // 4. Normalize line breaks (CRLF → LF)
    cleaned = cleaned.replace(/\r\n/g, '\n');
    cleaned = cleaned.replace(/\r/g, '\n');

    // 5. Remove excessive newlines (3+ → 2)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // 6. Trim whitespace from each line
    cleaned = cleaned
      .split('\n')
      .map((line) => line.trim())
      .join('\n');

    // 7. Remove leading/trailing whitespace from entire text
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Remove headers and footers (common patterns)
   * Heuristic: Remove lines that repeat across pages
   */
  static removeHeadersFooters(text: string): string {
    // Split into pages (assuming form feed or double newline as separator)
    const pages = text.split(/\f|\n\n/);

    if (pages.length < 2) {
      return text; // Not enough pages to detect patterns
    }

    // Find common first/last lines (likely headers/footers)
    const firstLines = pages.map((page) => page.split('\n')[0]);
    const lastLines = pages.map((page) => {
      const lines = page.split('\n');
      return lines[lines.length - 1];
    });

    // Check if first line repeats in >50% of pages
    const firstLineCount = this.countOccurrences(firstLines);
    const commonHeader = this.getMostCommon(firstLineCount, pages.length * 0.5);

    // Check if last line repeats in >50% of pages
    const lastLineCount = this.countOccurrences(lastLines);
    const commonFooter = this.getMostCommon(lastLineCount, pages.length * 0.5);

    // Remove headers/footers from each page
    return pages
      .map((page) => {
        const lines = page.split('\n');

        if (commonHeader && lines[0] === commonHeader) {
          lines.shift();
        }

        if (commonFooter && lines[lines.length - 1] === commonFooter) {
          lines.pop();
        }

        return lines.join('\n');
      })
      .join('\n\n');
  }

  /**
   * Extract only meaningful text (remove page numbers, footnotes, etc.)
   */
  static extractMainContent(text: string): string {
    let content = text;

    // Remove standalone page numbers (e.g., "Page 1", "- 5 -")
    content = content.replace(/^\s*(Page\s+\d+|[\-–—]\s*\d+\s*[\-–—])\s*$/gim, '');

    // Remove common footer patterns (e.g., "Copyright 2023")
    content = content.replace(/^\s*(Copyright|©)\s+\d{4}.*$/gim, '');

    // Remove URLs at end of lines
    content = content.replace(/https?:\/\/[^\s]+$/gim, '');

    return content.trim();
  }

  /**
   * Fix common PDF extraction issues
   */
  static fixCommonIssues(text: string): string {
    let fixed = text;

    // Fix broken hyphenation (word- \n word → word)
    fixed = fixed.replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2');

    // Fix ligatures (æ → ae, œ → oe, ﬁ → fi, ﬂ → fl)
    fixed = fixed.replace(/æ/g, 'ae');
    fixed = fixed.replace(/œ/g, 'oe');
    fixed = fixed.replace(/ﬁ/g, 'fi');
    fixed = fixed.replace(/ﬂ/g, 'fl');
    fixed = fixed.replace(/ﬀ/g, 'ff');

    // Fix smart quotes and dashes
    fixed = fixed.replace(/[""]/g, '"');
    fixed = fixed.replace(/['']/g, "'");
    fixed = fixed.replace(/[–—]/g, '-');
    fixed = fixed.replace(/…/g, '...');

    return fixed;
  }

  /**
   * Full cleaning pipeline
   */
  static fullClean(text: string): string {
    let cleaned = text;

    cleaned = this.clean(cleaned);
    cleaned = this.fixCommonIssues(cleaned);
    cleaned = this.removeHeadersFooters(cleaned);
    cleaned = this.extractMainContent(cleaned);

    return cleaned;
  }

  // Helper: Count occurrences in array
  private static countOccurrences(items: string[]): Map<string, number> {
    const counts = new Map<string, number>();

    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    return counts;
  }

  // Helper: Get most common item above threshold
  private static getMostCommon(
    counts: Map<string, number>,
    threshold: number
  ): string | null {
    let maxCount = 0;
    let maxItem: string | null = null;

    for (const [item, count] of counts.entries()) {
      if (count > maxCount && count >= threshold) {
        maxCount = count;
        maxItem = item;
      }
    }

    return maxItem;
  }
}

/**
 * Quick helper for basic cleaning
 */
export function cleanText(text: string): string {
  return TextCleaner.clean(text);
}

/**
 * Quick helper for full cleaning pipeline
 */
export function fullCleanText(text: string): string {
  return TextCleaner.fullClean(text);
}
