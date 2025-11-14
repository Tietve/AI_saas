import { Box, Typography, Button } from '@mui/material';
import { ReactNode } from 'react';
import {
  MessageSquare,
  Inbox,
  Search,
  FolderOpen,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  Package,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Generic Empty State Component
 * Displays when a list or container has no content
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        py: 6,
        px: 3,
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      {icon && (
        <Box
          sx={{
            mb: 3,
            p: 3,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      )}

      {/* Title */}
      <Typography
        variant="h6"
        component="h3"
        sx={{
          mb: 1,
          fontWeight: 600,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
            maxWidth: '400px',
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {action && (
            <Button
              variant="contained"
              onClick={action.onClick}
              sx={{
                textTransform: 'none',
                px: 3,
              }}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outlined"
              onClick={secondaryAction.onClick}
              sx={{
                textTransform: 'none',
                px: 3,
              }}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

/**
 * Empty Conversations - No conversations available
 */
export function EmptyConversations({ onNewChat }: { onNewChat: () => void }) {
  return (
    <EmptyState
      icon={<MessageSquare size={48} />}
      title="No conversations yet"
      description="Start a new conversation to get started with your AI assistant"
    />
  );
}

/**
 * Empty Messages - No messages in conversation
 */
export function EmptyMessages() {
  return (
    <EmptyState
      icon={<MessageSquare size={48} />}
      title="No messages yet"
      description="Send a message to start the conversation"
    />
  );
}

/**
 * Empty Search Results
 */
export function EmptySearchResults({ onClearSearch }: { onClearSearch?: () => void }) {
  return (
    <EmptyState
      icon={<Search size={48} />}
      title="No results found"
      description="Try adjusting your search terms or filters"
      action={
        onClearSearch
          ? {
              label: 'Clear Search',
              onClick: onClearSearch,
            }
          : undefined
      }
    />
  );
}

/**
 * Empty Inbox
 */
export function EmptyInbox() {
  return (
    <EmptyState
      icon={<Inbox size={48} />}
      title="Your inbox is empty"
      description="You're all caught up! No new items to show."
    />
  );
}

/**
 * Empty Folder
 */
export function EmptyFolder({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen size={48} />}
      title="This folder is empty"
      description="Add files or create new items to get started"
      action={
        onUpload
          ? {
              label: 'Upload Files',
              onClick: onUpload,
            }
          : undefined
      }
    />
  );
}

/**
 * No Data Available
 */
export function NoData() {
  return (
    <EmptyState
      icon={<Package size={48} />}
      title="No data available"
      description="There's no data to display at the moment"
    />
  );
}

/**
 * Error State - For failed data fetching
 */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle size={48} />}
      title="Something went wrong"
      description="We couldn't load the data. Please try again."
      action={{
        label: 'Retry',
        onClick: onRetry,
      }}
    />
  );
}

/**
 * Empty Documents
 */
export function EmptyDocuments({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<FileText size={48} />}
      title="No documents"
      description="Create your first document to get started"
      action={
        onCreate
          ? {
              label: 'Create Document',
              onClick: onCreate,
            }
          : undefined
      }
    />
  );
}

/**
 * Empty Team/Users
 */
export function EmptyTeam({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      icon={<Users size={48} />}
      title="No team members"
      description="Invite your team to collaborate together"
      action={
        onInvite
          ? {
              label: 'Invite Team',
              onClick: onInvite,
            }
          : undefined
      }
    />
  );
}

/**
 * Empty Calendar/Events
 */
export function EmptyCalendar({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<Calendar size={48} />}
      title="No events scheduled"
      description="Create an event to get started"
      action={
        onCreate
          ? {
              label: 'Create Event',
              onClick: onCreate,
            }
          : undefined
      }
    />
  );
}
