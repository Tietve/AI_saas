import { MessageSquare, Star } from 'lucide-react';
import { useState } from 'react';
import { ConversationActions } from './ConversationActions';
import { InlineRenameInput } from './InlineRenameInput';

export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  isPinned?: boolean;
  lastMessage?: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick: () => void;
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  onRename,
  onDelete,
  onPin,
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveRename = (newTitle: string) => {
    if (newTitle !== conversation.title) {
      onRename?.(conversation.id);
      // Note: The actual API call and title update should be handled by the parent
      // This is just triggering the rename action
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setIsEditing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRename) {
      handleEdit();
    }
  };

  return (
    <div
      style={{ position: 'relative', marginBottom: '4px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: '8px 10px',
          paddingRight: isHovered || isActive ? '100px' : '10px',
          border: 'none',
          background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.15s ease',
          color: isActive ? 'var(--text-sidebar)' : 'var(--text-sidebar-secondary)',
          textAlign: 'left',
          position: 'relative',
          transform: isHovered && !isActive ? 'translateX(2px)' : 'translateX(0)',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = 'var(--text-sidebar)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
          }
        }}
      >
        {/* Message Icon */}
        <MessageSquare size={14} style={{ flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ flex: 1, minWidth: 0 }} onDoubleClick={handleDoubleClick}>
            {isEditing ? (
              <InlineRenameInput
                initialValue={conversation.title}
                onSave={handleSaveRename}
                onCancel={handleCancelRename}
              />
            ) : (
              <p style={{
                fontSize: '13px',
                fontWeight: 400,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {conversation.title}
              </p>
            )}
          </div>
          {/* Pin indicator - always show when pinned */}
          {conversation.isPinned && !isEditing && (
            <Star size={14} fill="#fbbf24" color="#fbbf24" style={{ flexShrink: 0, opacity: 0.8 }} />
          )}
        </div>
      </button>

      {/* Action Buttons - Show on hover or when active, hide when editing */}
      {!isEditing && (
        <ConversationActions
          conversationId={conversation.id}
          isPinned={conversation.isPinned}
          onEdit={handleEdit}
          onDelete={onDelete}
          onPin={onPin}
          isVisible={isHovered || isActive}
        />
      )}
    </div>
  );
}
