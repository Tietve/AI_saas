import { Edit2, Trash2, Star, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ConversationActionsProps {
  conversationId: string;
  isPinned?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
  isVisible: boolean;
}

export function ConversationActions({
  conversationId,
  isPinned = false,
  onEdit,
  onDelete,
  onPin,
  isVisible,
}: ConversationActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(conversationId);
    setShowMenu(false);
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPin?.(conversationId);
    setShowMenu(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(conversationId);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  if (!isVisible && !showDeleteConfirm) return null;

  // Delete confirmation dialog
  if (showDeleteConfirm) {
    return (
      <div
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          padding: '8px',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
          animation: 'fadeIn 0.15s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDeleteConfirm}
          style={{
            padding: '6px 12px',
            border: 'none',
            background: '#ef4444',
            color: 'white',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            borderRadius: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ef4444';
          }}
        >
          Xóa
        </button>
        <button
          onClick={handleDeleteCancel}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--border-sidebar)',
            background: 'transparent',
            color: 'var(--text-sidebar)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            borderRadius: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Hủy
        </button>
      </div>
    );
  }

  // 3-dot menu button
  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Menu Button */}
      <button
        onClick={handleMenuToggle}
        style={{
          width: '28px',
          height: '28px',
          border: 'none',
          background: showMenu ? 'var(--bg-hover)' : 'transparent',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          color: 'var(--text-sidebar-secondary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-sidebar)';
        }}
        onMouseLeave={(e) => {
          if (!showMenu) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
          }
        }}
        title="Hành động"
      >
        <MoreVertical size={16} />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            right: '0',
            top: '32px',
            background: 'rgba(20, 20, 20, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            padding: '4px',
            minWidth: '140px',
            zIndex: 10,
            animation: 'fadeIn 0.15s ease',
            border: '1px solid var(--border-sidebar)',
          }}
        >
          {/* Pin Option */}
          {onPin && (
            <button
              onClick={handlePin}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                color: isPinned ? '#fbbf24' : 'var(--text-sidebar)',
                fontSize: '13px',
                fontWeight: 500,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Star size={14} fill={isPinned ? '#fbbf24' : 'none'} />
              <span>{isPinned ? 'Bỏ ghim' : 'Ghim'}</span>
            </button>
          )}

          {/* Edit Option */}
          {onEdit && (
            <button
              onClick={handleEdit}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                color: 'var(--text-sidebar)',
                fontSize: '13px',
                fontWeight: 500,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Edit2 size={14} />
              <span>Đổi tên</span>
            </button>
          )}

          {/* Delete Option */}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                color: 'var(--text-sidebar)',
                fontSize: '13px',
                fontWeight: 500,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-sidebar)';
              }}
            >
              <Trash2 size={14} />
              <span>Xóa</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
