import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';

/**
 * Hook to get all conversations
 */
export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to get a single conversation with messages
 */
export const useConversation = (conversationId?: string) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId, // Only fetch if conversationId is provided
    staleTime: 10 * 1000, // 10 seconds
  });
};

/**
 * Hook to delete a conversation
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.deleteConversation,
    onSuccess: () => {
      // Invalidate conversations list to refetch
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

/**
 * Hook to get token usage
 */
export const useTokenUsage = () => {
  return useQuery({
    queryKey: ['tokenUsage'],
    queryFn: chatApi.getUsage,
    staleTime: 60 * 1000, // 1 minute
  });
};
