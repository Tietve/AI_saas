import { ragRetrieverAgent, RAGDocument } from '../agents/rag-retriever.agent';
import {
  conversationStateService,
  ConversationStateData,
} from './conversation-state.service';
import logger from '../config/logger.config';

export interface MultiTurnRAGResult {
  documents: RAGDocument[];
  totalRetrieved: number;
  newKnowledgeCount: number;
  filteredOutCount: number;
  latencyMs: number;
}

/**
 * Context-aware RAG retrieval for multi-turn conversations
 */
export class MultiTurnRAGService {
  /**
   * Retrieve relevant knowledge with conversation context awareness
   */
  public async retrieve(
    userMessage: string,
    conversationId: string,
    userId: string,
    options?: {
      topK?: number;
      minScore?: number;
    }
  ): Promise<MultiTurnRAGResult> {
    const startTime = Date.now();

    try {
      // Get conversation state
      const state = await conversationStateService.getOrCreate(
        conversationId,
        userId
      );

      // Build enriched query
      const enrichedQuery = this.buildEnrichedQuery(userMessage, state);

      logger.info(
        `[MultiTurnRAG] Turn ${state.turnNumber + 1} - Retrieving for: "${userMessage.substring(0, 50)}..."`
      );

      // Retrieve from RAG
      const topK = options?.topK || 10; // Retrieve more initially
      const ragResult = await ragRetrieverAgent.retrieve(enrichedQuery, {
        topK,
        minScore: options?.minScore || 0.7,
        userId,
      });

      // Filter out already-used knowledge
      const newDocuments = this.filterUnusedDocuments(
        ragResult.documents,
        state
      );

      const filteredCount = ragResult.documents.length - newDocuments.length;

      // Take top 3-5 NEW documents
      const selectedDocuments = newDocuments.slice(
        0,
        conversationStateService.isFirstTurn(state) ? 5 : 3
      );

      // Mark as used
      const selectedIds = selectedDocuments.map((doc) => doc.id);
      conversationStateService.markKnowledgeUsed(conversationId, selectedIds);

      const latencyMs = Date.now() - startTime;

      logger.info(
        `[MultiTurnRAG] Retrieved ${selectedDocuments.length} NEW docs (filtered ${filteredCount} used) in ${latencyMs}ms`
      );

      return {
        documents: selectedDocuments,
        totalRetrieved: ragResult.totalRetrieved,
        newKnowledgeCount: selectedDocuments.length,
        filteredOutCount: filteredCount,
        latencyMs,
      };
    } catch (error) {
      logger.error('[MultiTurnRAG] Retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Build enriched query with conversation context
   */
  private buildEnrichedQuery(
    userMessage: string,
    state: ConversationStateData
  ): string {
    // First turn: Just use the message as-is
    if (conversationStateService.isFirstTurn(state)) {
      return userMessage;
    }

    // Follow-up turns: Add context to improve retrieval
    const contextParts: string[] = [];

    if (state.currentDomain) {
      contextParts.push(`Domain: ${state.currentDomain}`);
    }

    if (state.currentTask) {
      contextParts.push(`Task: ${state.currentTask}`);
    }

    // Add brief history (last 2 messages)
    if (state.messageHistory.length > 0) {
      const recent = state.messageHistory.slice(-2);
      contextParts.push('Recent context:');
      recent.forEach((msg) => {
        contextParts.push(`- ${msg.content.substring(0, 80)}`);
      });
    }

    contextParts.push(`Current question: ${userMessage}`);

    return contextParts.join('\n');
  }

  /**
   * Filter out documents that have already been used
   */
  private filterUnusedDocuments(
    documents: RAGDocument[],
    state: ConversationStateData
  ): RAGDocument[] {
    return documents.filter((doc) => !state.usedKnowledgeIds.has(doc.id));
  }

  /**
   * Format documents as context string (optimized for multi-turn)
   */
  public formatContext(
    documents: RAGDocument[],
    isFirstTurn: boolean
  ): string {
    if (documents.length === 0) {
      return '';
    }

    const header = isFirstTurn
      ? '📚 Relevant Knowledge:'
      : '📚 Additional Knowledge:';

    const contextParts = documents.map((doc, index) => {
      return `[${index + 1}] (Relevance: ${(doc.score * 100).toFixed(0)}%)\n${doc.content}`;
    });

    return `${header}\n\n${contextParts.join('\n\n---\n\n')}`;
  }

  /**
   * Detect if user is starting a new topic (should reset state)
   */
  public detectTopicShift(
    userMessage: string,
    state: ConversationStateData
  ): boolean {
    // Simple heuristics for topic shift
    const shiftKeywords = [
      'new topic',
      'different question',
      'switch to',
      'change subject',
      'forget that',
      'start over',
      'never mind',
      // Vietnamese
      'chủ đề mới',
      'câu hỏi khác',
      'chuyển sang',
      'thôi',
      'quên đi',
      'bắt đầu lại',
    ];

    const messageLower = userMessage.toLowerCase();

    return shiftKeywords.some((keyword) => messageLower.includes(keyword));
  }

  /**
   * Smart retrieval decision: Should we retrieve new knowledge?
   */
  public async shouldRetrieveNewKnowledge(
    userMessage: string,
    state: ConversationStateData
  ): Promise<boolean> {
    // Always retrieve on first turn
    if (conversationStateService.isFirstTurn(state)) {
      return true;
    }

    // If user is asking clarification ("what is X?", "explain Y")
    const clarificationPatterns = [
      /what (is|are|does)/i,
      /explain/i,
      /tell me (about|more)/i,
      /how (do|does|to)/i,
      /why/i,
      // Vietnamese
      /là gì/i,
      /giải thích/i,
      /cho tôi biết/i,
      /làm sao/i,
      /tại sao/i,
    ];

    const needsExplanation = clarificationPatterns.some((pattern) =>
      pattern.test(userMessage)
    );

    if (needsExplanation) {
      return true; // Might need new knowledge to explain
    }

    // If user is continuing implementation ("next?", "and then?")
    const continuationPatterns = [
      /^(and|then|next|what about|còn)/i,
      /after that/i,
      /what (else|next)/i,
    ];

    const isContinuation = continuationPatterns.some((pattern) =>
      pattern.test(userMessage)
    );

    if (isContinuation && state.usedKnowledgeIds.size < 5) {
      return false; // Can reuse existing knowledge for continuation
    }

    // Default: retrieve new knowledge
    return true;
  }
}

// Export singleton
export const multiTurnRAGService = new MultiTurnRAGService();
