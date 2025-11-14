import { Box, Paper, Avatar, Typography, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Copy, RotateCw, ThumbsUp, ThumbsDown, Edit, Trash2, Pin, MoreVertical } from 'lucide-react';
import { useState, memo } from 'react';
import { MarkdownRenderer } from '@/shared/components/MarkdownRenderer';
import { TokenCounter } from '@/shared/components/TokenCounter';
import type { Message } from '@/shared/types';

// Re-export Message type for convenience
export type { Message };

interface MessageItemProps {
  message: Message;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, type: 'up' | 'down') => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
}

export const MessageItem = memo(function MessageItem({
  message,
  onCopy,
  onRegenerate,
  onFeedback,
  onEdit,
  onDelete,
  onPin,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isUser = message.role === 'user';

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = () => {
    onCopy?.(message.content);
    navigator.clipboard.writeText(message.content);
  };

  return (
    <Box
      component="article"
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
      sx={{
        width: '100%',
        // Compact spacing for better information density
        py: isUser ? 1.5 : 2,
        mb: isUser ? 1 : 0,
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isUser ? (
        // USER MESSAGE - Keep bubble style, right-aligned
        <Box
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            display: 'flex',
            flexDirection: 'row-reverse',
            gap: 2,
            alignItems: 'flex-start',
            px: 3,
          }}
        >
          {/* Avatar - Compact size */}
          <Avatar
            aria-label="User avatar"
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'var(--primary-500)',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            U
          </Avatar>

          {/* Message Content */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ maxWidth: '65%' }}>
              <Paper
                elevation={0}
                className="transition-all animate-fade-in"
                sx={{
                  px: 2.5,
                  py: 1.5,
                  bgcolor: 'var(--primary-500)',
                  color: '#ffffff',
                  borderRadius: '14px',
                  position: 'relative',
                  border: message.isPinned ? '2px solid #fbbf24' : 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'var(--primary-600)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                {/* Pin Indicator */}
                {message.isPinned && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: '#fbbf24',
                    }}
                  >
                    <Pin size={14} fill="currentColor" />
                  </Box>
                )}
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.5,
                    color: '#ffffff',
                    fontSize: '0.9rem',
                  }}
                >
                  {message.content}
                </Typography>

                {/* Timestamp and Token Count */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography
                    variant="caption"
                    component="time"
                    dateTime={message.timestamp.toISOString()}
                    aria-label={`Sent at ${message.timestamp.toLocaleTimeString()}`}
                    sx={{
                      opacity: 0.8,
                      fontSize: '0.75rem',
                      color: '#ffffff',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                  <TokenCounter
                    content={message.content}
                    mode="compact"
                    sx={{
                      '& .MuiChip-root': {
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.25)',
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>

              {/* Action Buttons */}
              <Box
                role="toolbar"
                aria-label="Message actions"
                className="transition-opacity"
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  mt: 1,
                  justifyContent: 'flex-end',
                  opacity: showActions ? 1 : 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <Tooltip title="Copy">
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    aria-label="Copy message to clipboard"
                    className="hover-scale"
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Copy size={14} />
                  </IconButton>
                </Tooltip>

                {/* More actions menu */}
                {(onEdit || onDelete || onPin) && (
                  <>
                    <Tooltip title="More actions">
                      <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                        aria-label="More actions"
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                          },
                        }}
                      >
                        <MoreVertical size={14} />
                      </IconButton>
                    </Tooltip>

                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                    >
                      {onEdit && (
                        <MenuItem
                          onClick={() => {
                            onEdit(message.id);
                            handleMenuClose();
                          }}
                        >
                          <ListItemIcon>
                            <Edit size={16} />
                          </ListItemIcon>
                          <ListItemText>Edit</ListItemText>
                        </MenuItem>
                      )}

                      {onPin && (
                        <MenuItem
                          onClick={() => {
                            onPin(message.id);
                            handleMenuClose();
                          }}
                        >
                          <ListItemIcon>
                            <Pin size={16} />
                          </ListItemIcon>
                          <ListItemText>{message.isPinned ? 'Unpin' : 'Pin'}</ListItemText>
                        </MenuItem>
                      )}

                      {onDelete && (
                        <MenuItem
                          onClick={() => {
                            onDelete(message.id);
                            handleMenuClose();
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <ListItemIcon>
                            <Trash2 size={16} color="currentColor" />
                          </ListItemIcon>
                          <ListItemText>Delete</ListItemText>
                        </MenuItem>
                      )}
                    </Menu>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      ) : (
        // BOT MESSAGE - NO bubble, full-width, on background (ChatGPT style)
        <Box
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            px: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
            }}
          >
            {/* Avatar - Compact size */}
            <Avatar
              aria-label="AI assistant avatar"
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#6366f1',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              AI
            </Avatar>

            {/* Message Content - NO BUBBLE */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Pin Indicator */}
              {message.isPinned && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: '#fbbf24',
                    fontSize: '0.75rem',
                    mb: 1,
                  }}
                >
                  <Pin size={12} fill="currentColor" />
                  <span>Pinned</span>
                </Box>
              )}

              <MarkdownRenderer
                content={message.content}
                className="message-content"
              />

              {/* Timestamp and Token Count - Compact spacing */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
                <Typography
                  variant="caption"
                  component="time"
                  dateTime={message.timestamp.toISOString()}
                  aria-label={`Sent at ${message.timestamp.toLocaleTimeString()}`}
                  sx={{
                    opacity: 0.5,
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)', // Use theme secondary color
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
                <TokenCounter
                  content={message.content}
                  mode="compact"
                />
              </Box>

              {/* Action Buttons */}
              <Box
                role="toolbar"
                aria-label="Message actions"
                className="transition-opacity"
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  mt: 1.5,
                  opacity: showActions ? 1 : 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <Tooltip title="Copy">
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    aria-label="Copy message to clipboard"
                    className="hover-scale"
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: 'var(--bg-hover)',
                      color: 'var(--text-primary)', // Dark green in light mode, light in dark mode
                      '&:hover': {
                        bgcolor: 'var(--bg-active)',
                        color: 'var(--text-primary)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Copy size={14} />
                  </IconButton>
                </Tooltip>

                {onRegenerate && (
                  <Tooltip title="Regenerate">
                    <IconButton
                      size="small"
                      onClick={() => onRegenerate(message.id)}
                      aria-label="Regenerate response"
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: 'var(--bg-hover)',
                        color: 'var(--text-primary)',
                        '&:hover': {
                          bgcolor: 'var(--bg-active)',
                          color: 'var(--text-primary)',
                        },
                      }}
                    >
                      <RotateCw size={14} />
                    </IconButton>
                  </Tooltip>
                )}

                {onFeedback && (
                  <>
                    <Tooltip title="Good response">
                      <IconButton
                        size="small"
                        onClick={() => onFeedback(message.id, 'up')}
                        aria-label="Mark as good response"
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: 'var(--bg-hover)',
                          color: 'var(--text-primary)',
                          '&:hover': {
                            bgcolor: 'var(--bg-active)',
                            color: '#10b981',
                          },
                        }}
                      >
                        <ThumbsUp size={14} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Bad response">
                      <IconButton
                        size="small"
                        onClick={() => onFeedback(message.id, 'down')}
                        aria-label="Mark as bad response"
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: 'var(--bg-hover)',
                          color: 'var(--text-primary)',
                          '&:hover': {
                            bgcolor: 'var(--bg-active)',
                            color: '#ef4444',
                          },
                        }}
                      >
                        <ThumbsDown size={14} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}

                {/* More actions menu */}
                {(onPin || onDelete) && (
                  <>
                    <Tooltip title="More actions">
                      <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                        aria-label="More actions"
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: 'var(--bg-hover)',
                          color: 'var(--text-primary)',
                          '&:hover': {
                            bgcolor: 'var(--bg-active)',
                            color: 'var(--text-primary)',
                          },
                        }}
                      >
                        <MoreVertical size={14} />
                      </IconButton>
                    </Tooltip>

                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                    >
                      {onPin && (
                        <MenuItem
                          onClick={() => {
                            onPin(message.id);
                            handleMenuClose();
                          }}
                        >
                          <ListItemIcon>
                            <Pin size={16} />
                          </ListItemIcon>
                          <ListItemText>{message.isPinned ? 'Unpin' : 'Pin'}</ListItemText>
                        </MenuItem>
                      )}

                      {onDelete && (
                        <MenuItem
                          onClick={() => {
                            onDelete(message.id);
                            handleMenuClose();
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <ListItemIcon>
                            <Trash2 size={16} color="currentColor" />
                          </ListItemIcon>
                          <ListItemText>Delete</ListItemText>
                        </MenuItem>
                      )}
                    </Menu>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
});
