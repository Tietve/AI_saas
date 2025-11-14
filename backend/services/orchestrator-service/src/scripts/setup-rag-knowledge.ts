/**
 * Setup RAG Knowledge Base
 * Parse RAG.md, create embeddings, upload to vector store
 */

import fs from 'fs';
import path from 'path';
import { embeddingService } from '../services/embedding.service';
import { vectorStoreService } from '../services/vector-store.service';
import { prisma } from '../config/database.config';
import logger from '../config/logger.config';

interface DocumentChunk {
  id: string;
  domain: string;
  title: string;
  content: string;
  metadata: {
    hasExample: boolean;
    hasTemplate: boolean;
    hasResearch: boolean;
    tags: string[];
    chunkIndex: number;
    totalChunks: number;
  };
}

class RAGKnowledgeSetup {
  private readonly ragFilePath = path.join(
    __dirname,
    '../../../../../RAG.md'
  );

  /**
   * Main setup process
   */
  public async setup(): Promise<void> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 RAG KNOWLEDGE BASE SETUP`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // 1. Read RAG.md
      console.log(`📖 Reading RAG.md...`);
      const ragContent = fs.readFileSync(this.ragFilePath, 'utf-8');
      console.log(`✅ Loaded ${ragContent.length} characters\n`);

      // 2. Parse into sections
      console.log(`✂️  Parsing into sections...`);
      const chunks = this.parseIntoChunks(ragContent);
      console.log(`✅ Created ${chunks.length} chunks\n`);

      // 3. Create embeddings and upload
      console.log(`🔢 Creating embeddings and uploading...\n`);
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        try {
          console.log(
            `[${i + 1}/${chunks.length}] Processing: ${chunk.title.substring(0, 50)}...`
          );

          // Create embedding
          const embeddingResult = await embeddingService.embed(chunk.content);

          // Upload to vector store
          await vectorStoreService.upsert([
            {
              id: chunk.id,
              embedding: embeddingResult.embedding,
              metadata: {
                userId: 'system',
                domain: chunk.domain,
                title: chunk.title,
                content: chunk.content,
                hasExample: chunk.metadata.hasExample,
                hasTemplate: chunk.metadata.hasTemplate,
                hasResearch: chunk.metadata.hasResearch,
                tags: chunk.metadata.tags,
                chunkIndex: chunk.metadata.chunkIndex,
                totalChunks: chunk.metadata.totalChunks,
              },
            },
          ]);

          // Save to database
          await prisma.knowledgeBase.create({
            data: {
              id: chunk.id,
              userId: 'system',
              title: chunk.title,
              content: chunk.content,
              category: chunk.domain,
              tags: chunk.metadata.tags,
              chunkCount: 1,
            },
          });

          successCount++;
          console.log(
            `  ✅ Success (${embeddingResult.tokens} tokens, ${embeddingResult.cached ? 'cached' : 'new'})`
          );
        } catch (error) {
          errorCount++;
          console.error(
            `  ❌ Error processing chunk ${chunk.id}:`,
            error instanceof Error ? error.message : error
          );
        }

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 SUMMARY`);
      console.log(`${'='.repeat(80)}`);
      console.log(`Total chunks: ${chunks.length}`);
      console.log(`✅ Successful: ${successCount}`);
      console.log(`❌ Failed: ${errorCount}`);
      console.log(`Success rate: ${Math.round((successCount / chunks.length) * 100)}%`);
      console.log(`\n✅ RAG Knowledge Base setup complete!\n`);
    } catch (error) {
      console.error(`\n❌ Setup failed:`, error);
      throw error;
    }
  }

  /**
   * Parse RAG.md into chunks by sections
   */
  private parseIntoChunks(content: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    // Split by ### headers (sections)
    const sectionRegex = /^### (.+)$/gm;
    const sections: Array<{ title: string; content: string; start: number }> =
      [];

    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
      sections.push({
        title: match[1].trim(),
        content: '',
        start: match.index,
      });
    }

    // Extract content for each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const nextSection = sections[i + 1];

      const startPos = section.start;
      const endPos = nextSection ? nextSection.start : content.length;

      section.content = content.substring(startPos, endPos).trim();
    }

    // Determine domain from position in file
    let currentDomain = 'DOMAIN_1_FUNDAMENTALS';
    const domainRegex = /^## DOMAIN (\d+):/gm;

    for (const section of sections) {
      // Check if this section starts a new domain
      const domainMatch = content
        .substring(0, section.start)
        .match(domainRegex);
      if (domainMatch) {
        const lastDomainMatch = domainMatch[domainMatch.length - 1];
        const domainNum = lastDomainMatch.match(/DOMAIN (\d+)/)?.[1];
        if (domainNum) {
          currentDomain = `DOMAIN_${domainNum}`;
        }
      }

      // Detect metadata
      const hasExample =
        section.content.includes('Example:') ||
        section.content.includes('Before/After') ||
        section.content.includes('❌') ||
        section.content.includes('✅');

      const hasTemplate =
        section.content.includes('Template:') ||
        section.content.includes('```') ||
        section.content.includes('Master Template');

      const hasResearch =
        section.content.includes('et al.') ||
        section.content.includes('Research') ||
        section.content.includes('%') ||
        section.content.includes('accuracy');

      // Extract tags from content
      const tags = this.extractTags(section.title, section.content);

      // Check if section is too large (> 1500 chars) - split if needed
      const maxChunkSize = 1500;
      const sectionChunks = this.splitLargeSection(
        section.content,
        maxChunkSize
      );

      sectionChunks.forEach((chunkContent, chunkIndex) => {
        const chunkId = `kb_${currentDomain.toLowerCase()}_${this.slugify(section.title)}_${chunkIndex}`;

        chunks.push({
          id: chunkId,
          domain: currentDomain,
          title: section.title,
          content: chunkContent,
          metadata: {
            hasExample,
            hasTemplate,
            hasResearch,
            tags,
            chunkIndex,
            totalChunks: sectionChunks.length,
          },
        });
      });
    }

    return chunks;
  }

  /**
   * Split large section into smaller chunks
   */
  private splitLargeSection(
    content: string,
    maxSize: number
  ): string[] {
    if (content.length <= maxSize) {
      return [content];
    }

    const chunks: string[] = [];
    const paragraphs = content.split(/\n\n+/);

    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = paragraph;
        } else {
          // Single paragraph is too large - force split
          chunks.push(paragraph.substring(0, maxSize));
          currentChunk = paragraph.substring(maxSize);
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Extract tags from title and content
   */
  private extractTags(title: string, content: string): string[] {
    const tags: string[] = [];

    // Common prompt engineering terms
    const keywords = [
      'chain-of-thought',
      'few-shot',
      'zero-shot',
      'react',
      'tree-of-thoughts',
      'self-consistency',
      'role',
      'task',
      'context',
      'format',
      'json',
      'xml',
      'example',
      'template',
      'reasoning',
      'evaluation',
      'error handling',
      'prompt chaining',
      'meta-prompting',
    ];

    const combinedText = `${title} ${content}`.toLowerCase();

    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        tags.push(keyword);
      }
    }

    // Add domain-specific tags based on title
    if (title.toLowerCase().includes('role')) tags.push('role-assignment');
    if (title.toLowerCase().includes('format')) tags.push('output-format');
    if (title.toLowerCase().includes('context')) tags.push('context-management');

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Convert text to slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50);
  }

  /**
   * Clear existing knowledge base
   */
  public async clearKnowledgeBase(): Promise<void> {
    console.log(`🗑️  Clearing existing knowledge base...`);

    try {
      // Delete from database
      const deleted = await prisma.knowledgeBase.deleteMany({
        where: {
          userId: 'system',
        },
      });

      console.log(`✅ Deleted ${deleted.count} documents from database`);

      // Note: Vector store deletion would need to be implemented
      // based on your vector store (Pinecone/Qdrant)

      console.log(`✅ Knowledge base cleared\n`);
    } catch (error) {
      console.error(`❌ Error clearing knowledge base:`, error);
      throw error;
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const setup = new RAGKnowledgeSetup();

  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  (async () => {
    try {
      if (shouldClear) {
        await setup.clearKnowledgeBase();
      }

      await setup.setup();

      console.log(`✅ Setup completed successfully\n`);
      process.exit(0);
    } catch (error) {
      console.error(`❌ Setup failed:`, error);
      process.exit(1);
    }
  })();
}

export { RAGKnowledgeSetup };
