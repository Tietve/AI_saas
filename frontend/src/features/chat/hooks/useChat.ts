import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import type { SendMessageRequest } from '../api/types';

/**
 * Hook to send a message to the AI
 * Automatically invalidates conversations and current conversation queries
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => chatApi.sendMessage(data),
    onSuccess: (response) => {
      // Invalidate conversations list to show updated conversation
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // Invalidate the specific conversation to refetch messages
      queryClient.invalidateQueries({
        queryKey: ['conversation', response.conversationId],
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });
};

/**
 * Main chat hook combining all chat-related functionality
 * Use this hook in ChatPage for easy access to all chat features
 */
export const useChat = () => {
  const sendMessageMutation = useSendMessage();

  return {
    // Send message
    sendMessage: sendMessageMutation.mutate,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error,

    // Message data from last send
    lastMessage: sendMessageMutation.data,
  };
};
