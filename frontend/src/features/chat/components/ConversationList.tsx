import { useState, useMemo } from 'react';
import { Box, List, Typography } from '@mui/material';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from './ConversationItem';
import { ConversationSearch } from './ConversationSearch';
import { ConversationListSkeleton } from '@/shared/ui';
import { EmptyConversations, EmptySearchResults } from '@/shared/components/EmptyState';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  isLoading?: boolean;
  onConversationClick: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onPinConversation?: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  onConversationClick,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onPinConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(query));
  }, [conversations, searchQuery]);

  // Separate pinned and unpinned conversations
  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.isPinned);

  // Group unpinned conversations by date
  const groupedConversations = unpinnedConversations.reduce((groups, conversation) => {
    const date = new Date(conversation.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let group = 'Older';
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    } else if (date > weekAgo) {
      group = 'This Week';
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(conversation);
    return groups;
  }, {} as Record<string, Conversation[]>);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Conversation Search */}
      <Box sx={{ px: 1.5, pb: 2 }}>
        <ConversationSearch value={searchQuery} onChange={setSearchQuery} />
      </Box>

      {/* Conversations List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: '3px',
          },
        }}
      >
        {isLoading ? (
          <ConversationListSkeleton count={5} />
        ) : conversations.length === 0 ? (
          <EmptyConversations onNewChat={onNewConversation} />
        ) : filteredConversations.length === 0 ? (
          <EmptySearchResults onClearSearch={() => setSearchQuery('')} />
        ) : (
          <List disablePadding>
            {/* Pinned Conversations Section */}
            {pinnedConversations.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 2,
                    py: 1,
                    color: 'var(--text-sidebar-secondary)',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    fontSize: '11px',
                    letterSpacing: '0.3px',
                  }}
                >
                  Pinned
                </Typography>
                {pinnedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onClick={() => onConversationClick(conversation.id)}
                    onRename={onRenameConversation}
                    onDelete={onDeleteConversation}
                    onPin={onPinConversation}
                  />
                ))}
                {/* Separator between pinned and regular conversations */}
                <Box
                  sx={{
                    height: '1px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    mx: 2,
                    mt: 2,
                  }}
                />
              </Box>
            )}

            {/* Grouped Conversations by Date */}
            {groupOrder.map((group) => {
              const items = groupedConversations[group];
              if (!items || items.length === 0) return null;

              return (
                <Box key={group} sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      px: 2,
                      py: 1,
                      color: 'var(--text-sidebar-secondary)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      fontSize: '11px',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {group}
                  </Typography>
                  {items.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onClick={() => onConversationClick(conversation.id)}
                      onRename={onRenameConversation}
                      onDelete={onDeleteConversation}
                      onPin={onPinConversation}
                    />
                  ))}
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
