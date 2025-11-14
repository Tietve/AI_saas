import { Box, Paper } from '@mui/material';
import { useEffect, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { MessageItem } from './MessageItem';
import type { Message } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, type: 'up' | 'down') => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
}

export function MessageList({
  messages,
  isTyping,
  onCopy,
  onRegenerate,
  onFeedback,
  onEdit,
  onDelete,
  onPin,
}: MessageListProps) {
  const virtuosoRef = useRef<any>(null);

  // Note: Removed manual scroll - Virtuoso's followOutput="smooth" handles auto-scrolling
  // This prevents double-scrolling conflicts that caused lag during streaming

  // Show empty state when no messages
  if (messages.length === 0) {
    return (
      <Box
        component="main"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 4,
        }}
      >
        <Box
          role="status"
          aria-label="No messages"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              boxShadow: '0 2px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Box sx={{ fontSize: '3rem', mb: 2 }} role="img" aria-label="Chat icon">
              💬
            </Box>
            <Box component="h2" sx={{ fontSize: '1.25rem', fontWeight: 500, mb: 1 }}>
              Start a conversation
            </Box>
            <Box component="p" sx={{ fontSize: '0.875rem', opacity: 0.7 }}>
              Send a message to begin chatting with AI
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      sx={{
        flex: 1,
        height: '100%',
        width: '100%',
        position: 'relative',
        zIndex: 100,
        '& > div': {
          // Custom scrollbar for Virtuoso
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.5)',
            },
          },
        },
      }}
    >
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        style={{ height: '100%' }}
        itemContent={(index, message) => (
          <Box
            sx={{
              // Unified background - no alternating colors
              bgcolor: 'transparent',
              px: 0,
              py: index === 0 ? 4 : 0,
              pb: index === messages.length - 1 && !isTyping ? 4 : 0
            }}
          >
            <MessageItem
              message={message}
              onCopy={onCopy}
              onRegenerate={onRegenerate}
              onFeedback={onFeedback}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
            />
          </Box>
        )}
        followOutput={(isAtBottom) => {
          // Only auto-scroll if user is already at bottom
          // Prevents annoying scroll jumps when user is reading history
          return isAtBottom ? 'smooth' : false;
        }}
        components={{
          Footer: isTyping ? () => (
            <Box sx={{
              bgcolor: 'transparent',
              // Removed border for unified look
              py: 4
            }}>
              <Box sx={{ maxWidth: '900px', mx: 'auto', px: 3 }}>
                <TypingIndicator />
              </Box>
            </Box>
          ) : undefined,
        }}
      />
    </Box>
  );
}
