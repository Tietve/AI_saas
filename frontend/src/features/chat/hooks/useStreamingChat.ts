import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { streamMessage } from '../api/streamingClient';

export interface StreamingState {
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
}

export interface StreamingResult {
  conversationId: string;
  messageId: string;
  tokenCount: number;
  content: string;
}

/**
 * Hook to handle streaming chat messages
 * Provides real-time AI response streaming with SSE
 */
export const useStreamingChat = () => {
  const queryClient = useQueryClient();
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    streamingContent: '',
    error: null,
  });

  // Store the result for onSuccess callback
  const streamingResultRef = useRef<StreamingResult | null>(null);

  /**
   * Send a message and stream the response
   */
  const sendStreamingMessage = useCallback(
    async (
      message: string,
      conversationId: string | undefined,
      model: string | undefined,
      onSuccess?: (result: StreamingResult) => void
    ) => {
      // Reset state
      setStreamingState({
        isStreaming: true,
        streamingContent: '',
        error: null,
      });
      streamingResultRef.current = null;

      // Track full content in local variable to avoid stale closure
      let fullContent = '';

      // Debounce state updates to reduce re-renders during streaming
      let rafId: number | null = null;
      let pendingUpdate = false;

      try {
        await streamMessage(message, conversationId, model, {
          onChunk: (content: string) => {
            fullContent += content;

            // Batch updates using requestAnimationFrame - updates at most once per frame (~60fps)
            // This reduces 100+ re-renders to ~6-10 re-renders per response
            if (!pendingUpdate) {
              pendingUpdate = true;
              rafId = requestAnimationFrame(() => {
                setStreamingState((prev) => ({
                  ...prev,
                  streamingContent: fullContent,
                }));
                pendingUpdate = false;
              });
            }
          },
          onDone: async (data) => {
            // Cancel any pending RAF updates
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
            }

            const result: StreamingResult = {
              conversationId: data.conversationId,
              messageId: data.messageId,
              tokenCount: data.tokenCount,
              content: fullContent,
            };

            streamingResultRef.current = result;

            // Mark streaming as complete with final content
            setStreamingState({
              isStreaming: false,
              streamingContent: fullContent,
              error: null,
            });

            // Update queries to reflect new messages
            // Invalidate conversations list (sidebar) to show updated "last message"
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

            // FIX: Await refetch to prevent scroll jumping
            // This ensures the conversation cache is fully updated before we clear optimistic messages
            // Without await, there's a race condition:
            // 1. refetch starts (but doesn't wait)
            // 2. onSuccess called immediately
            // 3. optimistic messages cleared
            // 4. refetch completes later
            // Result: Two separate data updates → Virtuoso scroll position jumps
            //
            // With await, the sequence is:
            // 1. refetch completes
            // 2. onSuccess called
            // 3. optimistic messages cleared
            // Result: Single atomic update → No scroll jumping
            try {
              await queryClient.refetchQueries({
                queryKey: ['conversation', result.conversationId],
                exact: true,
                type: 'active'
              });
            } catch (refetchError) {
              console.error('[useStreamingChat] Failed to refetch conversation:', refetchError);
              // Continue anyway - optimistic messages will remain visible
            }

            // Call success callback AFTER refetch completes
            if (onSuccess) {
              onSuccess(result);
            }
          },
          onError: (error: string) => {
            // Cancel any pending RAF updates
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
            }

            setStreamingState({
              isStreaming: false,
              streamingContent: '',
              error,
            });
          },
        });
      } catch (error: any) {
        console.error('[useStreamingChat] Error:', error);
        setStreamingState({
          isStreaming: false,
          streamingContent: '',
          error: error.message || 'Failed to stream message',
        });
      }
    },
    [queryClient]
  );

  /**
   * Reset streaming state (e.g., when switching conversations)
   */
  const resetStreaming = useCallback(() => {
    setStreamingState({
      isStreaming: false,
      streamingContent: '',
      error: null,
    });
    streamingResultRef.current = null;
  }, []);

  return {
    // State
    isStreaming: streamingState.isStreaming,
    streamingContent: streamingState.streamingContent,
    error: streamingState.error,

    // Actions
    sendStreamingMessage,
    resetStreaming,

    // Last result
    lastResult: streamingResultRef.current,
  };
};
