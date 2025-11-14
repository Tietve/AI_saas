import { prisma } from '../config/database.config';
import logger from '../config/logger.config';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  upgradedPrompt?: string;
  timestamp: Date;
}

export interface ConversationStateData {
  id: string;
  conversationId: string;
  userId: string;
  turnNumber: number;
  currentRole?: string;
  currentTask?: string;
  currentDomain?: string;
  contextSummary: string;
  usedKnowledgeIds: Set<string>;
  messageHistory: Message[];
  lastActivity: Date;
  expiresAt: Date;
}

/**
 * Manages conversation state for Multi-Turn RAG
 */
export class ConversationStateService {
  private inMemoryCache = new Map<string, ConversationStateData>();

  /**
   * Get or create conversation state
   */
  public async getOrCreate(
    conversationId: string,
    userId: string
  ): Promise<ConversationStateData> {
    // Check in-memory cache first
    if (this.inMemoryCache.has(conversationId)) {
      const cached = this.inMemoryCache.get(conversationId)!;

      // Check if expired
      if (cached.expiresAt > new Date()) {
        return cached;
      } else {
        this.inMemoryCache.delete(conversationId);
      }
    }

    // Try to load from database
    try {
      const dbState = await prisma.conversationState.findUnique({
        where: { conversationId },
      });

      if (dbState && dbState.expiresAt > new Date()) {
        // Parse and cache
        const state = this.parseFromDB(dbState);
        this.inMemoryCache.set(conversationId, state);
        return state;
      }
    } catch (error) {
      logger.error('[ConversationState] Error loading from DB:', error);
    }

    // Create new state
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const newState: ConversationStateData = {
      id: '',
      conversationId,
      userId,
      turnNumber: 0,
      currentRole: undefined,
      currentTask: undefined,
      currentDomain: undefined,
      contextSummary: '',
      usedKnowledgeIds: new Set(),
      messageHistory: [],
      lastActivity: new Date(),
      expiresAt,
    };

    // Save to DB
    try {
      const created = await prisma.conversationState.create({
        data: {
          conversationId,
          userId,
          turnNumber: 0,
          contextSummary: '',
          usedKnowledgeIds: [],
          messageHistory: [],
          expiresAt,
          lastActivity: new Date(),
        },
      });

      newState.id = created.id;
    } catch (error) {
      logger.error('[ConversationState] Error creating state:', error);
    }

    this.inMemoryCache.set(conversationId, newState);
    return newState;
  }

  /**
   * Check if this is the first turn
   */
  public isFirstTurn(state: ConversationStateData): boolean {
    return state.turnNumber === 0;
  }

  /**
   * Increment turn number
   */
  public async incrementTurn(conversationId: string): Promise<void> {
    const state = this.inMemoryCache.get(conversationId);
    if (!state) return;

    state.turnNumber++;
    state.lastActivity = new Date();

    // Update DB async (don't block)
    this.updateDB(conversationId).catch((error) => {
      logger.error('[ConversationState] Error updating turn:', error);
    });
  }

  /**
   * Add message to history
   */
  public async addMessage(
    conversationId: string,
    message: Message
  ): Promise<void> {
    const state = this.inMemoryCache.get(conversationId);
    if (!state) return;

    state.messageHistory.push(message);

    // Keep only last 10 messages
    if (state.messageHistory.length > 10) {
      state.messageHistory = state.messageHistory.slice(-10);
    }

    state.lastActivity = new Date();

    // Update DB async
    this.updateDB(conversationId).catch((error) => {
      logger.error('[ConversationState] Error updating messages:', error);
    });
  }

  /**
   * Mark knowledge as used
   */
  public markKnowledgeUsed(
    conversationId: string,
    knowledgeIds: string[]
  ): void {
    const state = this.inMemoryCache.get(conversationId);
    if (!state) return;

    knowledgeIds.forEach((id) => state.usedKnowledgeIds.add(id));
    state.lastActivity = new Date();

    // Update DB async
    this.updateDB(conversationId).catch((error) => {
      logger.error('[ConversationState] Error marking knowledge:', error);
    });
  }

  /**
   * Update extracted context (role, task, domain)
   */
  public async updateContext(
    conversationId: string,
    context: {
      role?: string;
      task?: string;
      domain?: string;
      summary?: string;
    }
  ): Promise<void> {
    const state = this.inMemoryCache.get(conversationId);
    if (!state) return;

    if (context.role) state.currentRole = context.role;
    if (context.task) state.currentTask = context.task;
    if (context.domain) state.currentDomain = context.domain;
    if (context.summary) state.contextSummary = context.summary;

    state.lastActivity = new Date();

    // Update DB async
    this.updateDB(conversationId).catch((error) => {
      logger.error('[ConversationState] Error updating context:', error);
    });
  }

  /**
   * Build context summary from message history
   */
  public buildContextSummary(state: ConversationStateData): string {
    if (state.messageHistory.length === 0) {
      return '';
    }

    // Take last 5 messages
    const recent = state.messageHistory.slice(-5);

    const parts: string[] = [];

    if (state.currentRole) {
      parts.push(`Role: ${state.currentRole}`);
    }
    if (state.currentTask) {
      parts.push(`Task: ${state.currentTask}`);
    }

    parts.push('Recent conversation:');
    recent.forEach((msg) => {
      const preview = msg.content.substring(0, 100);
      parts.push(`- ${msg.role}: ${preview}${msg.content.length > 100 ? '...' : ''}`);
    });

    return parts.join('\n');
  }

  /**
   * Get knowledge IDs that haven't been used yet
   */
  public filterUnusedKnowledge(
    state: ConversationStateData,
    knowledgeIds: string[]
  ): string[] {
    return knowledgeIds.filter((id) => !state.usedKnowledgeIds.has(id));
  }

  /**
   * Clear conversation state (when user starts new topic)
   */
  public async clear(conversationId: string): Promise<void> {
    this.inMemoryCache.delete(conversationId);

    try {
      await prisma.conversationState.delete({
        where: { conversationId },
      });
    } catch (error) {
      logger.error('[ConversationState] Error clearing state:', error);
    }
  }

  /**
   * Cleanup expired states (run periodically)
   */
  public async cleanupExpired(): Promise<void> {
    try {
      const deleted = await prisma.conversationState.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info(`[ConversationState] Cleaned up ${deleted.count} expired states`);
    } catch (error) {
      logger.error('[ConversationState] Error cleaning up:', error);
    }

    // Also clean in-memory cache
    for (const [key, state] of this.inMemoryCache.entries()) {
      if (state.expiresAt < new Date()) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  // ====== Private helpers ======

  private parseFromDB(dbState: any): ConversationStateData {
    return {
      id: dbState.id,
      conversationId: dbState.conversationId,
      userId: dbState.userId,
      turnNumber: dbState.turnNumber,
      currentRole: dbState.currentRole || undefined,
      currentTask: dbState.currentTask || undefined,
      currentDomain: dbState.currentDomain || undefined,
      contextSummary: dbState.contextSummary,
      usedKnowledgeIds: new Set(dbState.usedKnowledgeIds || []),
      messageHistory: Array.isArray(dbState.messageHistory)
        ? dbState.messageHistory
        : [],
      lastActivity: dbState.lastActivity,
      expiresAt: dbState.expiresAt,
    };
  }

  private async updateDB(conversationId: string): Promise<void> {
    const state = this.inMemoryCache.get(conversationId);
    if (!state) return;

    await prisma.conversationState.update({
      where: { conversationId },
      data: {
        turnNumber: state.turnNumber,
        currentRole: state.currentRole,
        currentTask: state.currentTask,
        currentDomain: state.currentDomain,
        contextSummary: state.contextSummary,
        usedKnowledgeIds: Array.from(state.usedKnowledgeIds),
        messageHistory: state.messageHistory as any,
        lastActivity: state.lastActivity,
      },
    });
  }
}

// Export singleton
export const conversationStateService = new ConversationStateService();

// Run cleanup every 10 minutes
setInterval(
  () => {
    conversationStateService.cleanupExpired().catch((error) => {
      logger.error('[ConversationState] Cleanup task failed:', error);
    });
  },
  10 * 60 * 1000
);
