/**
 * RAG Service
 *
 * Retrieval-Augmented Generation for document Q&A
 */

import OpenAI from 'openai';
import {
  RagOptions,
  RagQueryResponse,
  RagStreamChunk,
  Source,
  TokenUsage,
  DocumentError,
} from '../types/document.types';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';

export class RagService {
  private openai: OpenAI;
  private embedding: EmbeddingService;
  private vectorStore: VectorStoreService;
  private defaultModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY!;

    if (!apiKey) {
      throw new DocumentError('OpenAI API key not configured', 'CONFIG_ERROR', 500);
    }

    this.openai = new OpenAI({ apiKey });
    this.embedding = new EmbeddingService(apiKey);
    this.vectorStore = new VectorStoreService();
    this.defaultModel = 'gpt-4o-mini'; // Fast and cost-effective
  }

  /**
   * Query document(s) with RAG
   * @param query Natural language question
   * @param options Query options (userId, documentId, topK, model)
   * @returns Answer with sources and token usage
   */
  async query(query: string, options: RagOptions): Promise<RagQueryResponse> {
    const { userId, documentId, topK = 5, model = this.defaultModel } = options;

    // Step 1: Generate query embedding
    const queryEmbedding = await this.embedding.generateSingleEmbedding(query);

    // Step 2: Search for similar chunks
    const similarChunks = await this.vectorStore.searchSimilar(queryEmbedding, {
      userId,
      documentId,
      topK,
      minSimilarity: 0.3, // Lower threshold for better recall
    });

    if (similarChunks.length === 0) {
      return {
        answer: 'I could not find any relevant information in your documents to answer this question.',
        sources: [],
        tokensUsed: {
          prompt: 0,
          completion: 0,
          total: 0,
        },
      };
    }

    // Step 3: Build context prompt
    const prompt = this.buildPrompt(query, similarChunks);

    // Step 4: Call OpenAI chat completion
    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer = completion.choices[0]?.message?.content || 'No answer generated';

    // Step 5: Format sources
    const sources = this.formatSources(similarChunks);

    // Step 6: Calculate token usage
    const tokensUsed: TokenUsage = {
      prompt: completion.usage?.prompt_tokens || 0,
      completion: completion.usage?.completion_tokens || 0,
      total: completion.usage?.total_tokens || 0,
    };

    return {
      answer,
      sources,
      tokensUsed,
    };
  }

  /**
   * Query with streaming response (Server-Sent Events)
   * @param query Natural language question
   * @param options Query options
   * @yields Streaming chunks (sources, content, done)
   */
  async *streamQuery(query: string, options: RagOptions): AsyncGenerator<RagStreamChunk> {
    const { userId, documentId, topK = 5, model = this.defaultModel } = options;

    try {
      // Step 1: Generate query embedding
      const queryEmbedding = await this.embedding.generateSingleEmbedding(query);

      // Step 2: Search for similar chunks
      const similarChunks = await this.vectorStore.searchSimilar(queryEmbedding, {
        userId,
        documentId,
        topK,
        minSimilarity: 0.3, // Lower threshold for better recall
      });

      // Step 3: Send sources first
      const sources = this.formatSources(similarChunks);
      yield { type: 'sources', sources };

      if (similarChunks.length === 0) {
        yield {
          type: 'chunk',
          content: 'I could not find any relevant information in your documents to answer this question.',
        };
        yield {
          type: 'done',
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
        };
        return;
      }

      // Step 4: Build context prompt
      const prompt = this.buildPrompt(query, similarChunks);

      // Step 5: Stream OpenAI response
      const stream = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });

      let promptTokens = 0;
      let completionTokens = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;

        if (content) {
          yield { type: 'chunk', content };
          completionTokens += 1; // Rough estimate
        }

        // Capture usage from final chunk
        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens;
          completionTokens = chunk.usage.completion_tokens;
        }
      }

      // Step 6: Send completion
      yield {
        type: 'done',
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
      };
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Build RAG prompt with context from retrieved chunks
   */
  private buildPrompt(query: string, chunks: any[]): string {
    // Build context from chunks
    const context = chunks
      .map((chunk, index) => {
        return `[Document: ${chunk.documentTitle}, Page: ${chunk.pageNumber || 'N/A'}, Similarity: ${(chunk.similarity * 100).toFixed(1)}%]\n${chunk.content}`;
      })
      .join('\n\n---\n\n');

    return `Context from documents:

${context}

---

Question: ${query}

Instructions:
- Answer the question based ONLY on the context provided above
- If the context doesn't contain enough information, say so clearly
- Cite which document(s) you used in your answer
- Be concise but comprehensive
- If multiple documents provide different information, mention the differences`;
  }

  /**
   * Get system prompt for RAG
   */
  private getSystemPrompt(): string {
    return `You are a helpful AI assistant that answers questions based on provided document context.

Key guidelines:
- Only use information from the provided context
- If the context doesn't answer the question, say "I don't have enough information in the documents to answer this"
- Cite document titles when referencing information
- Be accurate and factual, never make up information
- If there are contradictions in the sources, point them out
- Provide page numbers when available for reference`;
  }

  /**
   * Format sources for response
   */
  private formatSources(chunks: any[]): Source[] {
    return chunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      similarity: chunk.similarity,
      excerpt: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
    }));
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    await this.vectorStore.disconnect();
  }
}
