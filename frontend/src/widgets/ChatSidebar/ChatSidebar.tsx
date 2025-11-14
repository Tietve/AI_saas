import { ConversationList } from '@/features/chat/components/ConversationList';
import type { Conversation } from '@/features/chat/components/ConversationItem';
import { useChatStore } from '@/features/chat/store/chatStore';
import {
  SidebarToggleButton,
  UserProfileCard,
} from './components';
import { useTranslation } from 'react-i18next';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  isLoading?: boolean;
  onConversationClick: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onPinConversation?: (id: string) => void;
  tokenUsage: {
    used: number;
    limit: number;
    planTier: 'free' | 'plus' | 'pro';
  };
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  userName?: string;
  userEmail?: string;
  onUpgrade?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  isLoading,
  onConversationClick,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onPinConversation,
  tokenUsage,
  mobileOpen,
  onMobileClose,
  userName,
  userEmail,
  onLogout,
  onSettings,
}: ChatSidebarProps) {
  const { t } = useTranslation();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const { isSidebarCollapsed } = useChatStore();

  const sidebarWidth = isSidebarCollapsed ? 64 : 280;

  const sidebarContent = (
    <aside
      className={`sidebar ${mobileOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}
      style={{
        width: `${sidebarWidth}px`,
        minWidth: `${sidebarWidth}px`,
        height: '100vh', // Full height như cũ
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)',
        borderRight: '2px solid rgba(255, 255, 255, 0.2)',
        position: 'fixed',
        top: 0, // Bắt đầu từ top như cũ
        left: isMobile && !mobileOpen ? `-${sidebarWidth}px` : '0',
        zIndex: 1200,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.3s ease',
        overflow: 'hidden',
        willChange: 'width',
      }}
    >
      {/* Toggle Button - Chỉ hiện khi expanded */}
      {!isSidebarCollapsed && (
        <div style={{
          padding: '12px',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}>
          <SidebarToggleButton variant="default" />
        </div>
      )}

      {/* New Chat Button - Claude style (always show when expanded) */}
      {!isSidebarCollapsed && (
        <div style={{ padding: '0 12px 12px' }}>
          <button
            onClick={onNewConversation}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '10px',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar)',
              fontSize: '13px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{t('chat.sidebar.newChat')}</span>
          </button>
        </div>
      )}

      {/* Collapsed Sidebar - Icon-Only State with more icons */}
      {isSidebarCollapsed && (
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
          {/* Toggle Button - Expand Sidebar */}
          <button
            onClick={() => useChatStore.getState().toggleSidebar()}
            style={{
              width: '44px',
              height: '44px',
              border: 'none',
              background: 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'var(--text-sidebar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
            }}
            title="Expand sidebar"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>

          {/* New Chat Icon */}
          <button
            onClick={onNewConversation}
            style={{
              width: '44px',
              height: '44px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
            title={t('chat.sidebar.newChat')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Chat History Icon */}
          <button
            style={{
              width: '44px',
              height: '44px',
              border: 'none',
              background: 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-sidebar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
            }}
            title="Chat History"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>

          {/* Search Icon */}
          <button
            style={{
              width: '44px',
              height: '44px',
              border: 'none',
              background: 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-sidebar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
            }}
            title="Search chats"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Starred/Pinned Icon */}
          <button
            style={{
              width: '44px',
              height: '44px',
              border: 'none',
              background: 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-sidebar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
            }}
            title="Starred chats"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          {/* Divider */}
          <div style={{
            width: '32px',
            height: '1px',
            background: 'rgba(255, 255, 255, 0.1)',
            margin: '4px 0'
          }} />

          {/* Theme Toggle Icon */}
          <button
            style={{
              width: '44px',
              height: '44px',
              border: 'none',
              background: 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-sidebar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
            }}
            title="Toggle theme"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      )}

      {/* Conversations List */}
      <div
        style={{
          flex: 1,
          overflow: isSidebarCollapsed ? 'hidden' : 'auto',
          padding: '0 8px',
          opacity: isSidebarCollapsed ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {!isSidebarCollapsed && (
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            isLoading={isLoading}
            onConversationClick={onConversationClick}
            onNewConversation={onNewConversation}
            onRenameConversation={onRenameConversation}
            onDeleteConversation={onDeleteConversation}
            onPinConversation={onPinConversation}
          />
        )}
      </div>

      {/* Spacer khi collapsed */}
      {isSidebarCollapsed && <div style={{ flex: 1 }} />}

      {/* Footer Menu */}
      <div style={{ padding: '8px' }}>
        {/* Settings Button */}
        {!isSidebarCollapsed ? (
          <button
            onClick={() => {
              console.log('⚙️ Settings button clicked in sidebar');
              onSettings?.();
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              margin: '0 8px 6px',
              border: 'none',
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '10px',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar-secondary)',
              fontSize: '13px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-sidebar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
            }}
            title={t('chat.sidebar.settings')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{t('chat.sidebar.settings')}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              console.log('⚙️ Settings button clicked in sidebar (collapsed)');
              onSettings?.();
            }}
            style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 8px',
              padding: '0',
              border: 'none',
              background: 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-sidebar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
            }}
            title={t('chat.sidebar.settings')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* User Avatar khi collapsed */}
        {isSidebarCollapsed && (
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '8px auto',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title={userName || userEmail}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {(userName || userEmail || 'U')[0].toUpperCase()}
          </div>
        )}

        {/* Logout Button - Full khi expanded */}
        {!isSidebarCollapsed && (
          <button
            style={{
              width: '100%',
              padding: '8px 12px',
              margin: '0 8px',
              border: 'none',
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '10px',
              transition: 'all 0.15s ease',
              color: 'var(--text-sidebar-secondary)',
              fontSize: '13px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-sidebar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
            }}
            onClick={() => {
              console.log('🚪 Logout button clicked in sidebar');
              onLogout?.();
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{t('chat.sidebar.logout')}</span>
          </button>
        )}

        {/* User Profile Card - Full khi expanded */}
        {!isSidebarCollapsed && (
          <UserProfileCard
            userName={userName}
            userEmail={userEmail}
            planTier={tokenUsage.planTier}
          />
        )}
      </div>
    </aside>
  );

  // Mobile overlay
  if (isMobile && mobileOpen) {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
          }}
          onClick={onMobileClose}
        />
        {sidebarContent}
      </>
    );
  }

  // Floating toggle button when sidebar is collapsed (desktop only) - Icon nhỏ
  const floatingButton = !isMobile && isSidebarCollapsed && (
    <button
      onClick={() => {
        const chatStore = useChatStore.getState();
        chatStore.toggleSidebar();
      }}
      style={{
        position: 'fixed',
        top: '20px', // Về như cũ
        left: '16px',
        zIndex: 1001,
        width: '32px',
        height: '32px',
        padding: '8px',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        color: 'var(--text-sidebar-secondary)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      title={t('chat.sidebar.openSidebar')}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );

  return (
    <>
      {sidebarContent}
      {floatingButton}
    </>
  );
}
