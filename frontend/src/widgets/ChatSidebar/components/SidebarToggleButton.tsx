import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useChatStore } from '@/features/chat/store/chatStore';

interface SidebarToggleButtonProps {
  variant?: 'default' | 'floating' | 'header';
  className?: string;
}

export function SidebarToggleButton({ variant = 'default', className = '' }: SidebarToggleButtonProps) {
  const { isSidebarCollapsed, toggleSidebar } = useChatStore();

  // Styles based on variant
  const getStyles = () => {
    const baseStyle = {
      border: '2px solid rgba(255, 255, 255, 0.3)',
      background: isSidebarCollapsed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      color: 'var(--text-sidebar)',
    };

    if (variant === 'floating') {
      return {
        ...baseStyle,
        position: 'fixed' as const,
        top: '16px',
        left: '16px',
        width: '48px',
        height: '48px',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      };
    }

    if (variant === 'header') {
      return {
        ...baseStyle,
        width: '40px',
        height: '40px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      };
    }

    // Default variant (inside sidebar)
    return {
      ...baseStyle,
      width: isSidebarCollapsed ? '52px' : '44px',
      height: isSidebarCollapsed ? '52px' : '44px',
      boxShadow: isSidebarCollapsed ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
    };
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
    e.currentTarget.style.transform = 'scale(1.08)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = isSidebarCollapsed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)';
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
  };

  const iconSize = variant === 'header' ? 20 : 24;

  return (
    <button
      onClick={toggleSidebar}
      style={getStyles()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={isSidebarCollapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
      className={className}
      aria-label={isSidebarCollapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
    >
      {isSidebarCollapsed ? (
        <PanelLeftOpen size={iconSize} strokeWidth={2.5} />
      ) : (
        <PanelLeftClose size={iconSize} strokeWidth={2.5} />
      )}
    </button>
  );
}
