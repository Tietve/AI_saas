import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/widgets/Layout/MainLayout';
import { ChatSidebar } from '@/widgets/ChatSidebar/ChatSidebar';
import { SettingsPanel } from '@/widgets/Settings';
import { MessageList } from '@/features/chat/components/MessageList';
import { ExportMenu } from '@/features/chat/components/ExportMenu';
import { ShortcutsHelp } from '@/features/chat/components/ShortcutsHelp';
import { ChatInput, type ChatInputHandle } from '@/features/chat/components/ChatInput';
import { WelcomeScreen } from '@/features/chat/components/WelcomeScreen';
import type { Message } from '@/features/chat/components/MessageItem';
import { useToast, Toast, Spinner } from '@/shared/ui';
import { ThemeDecorations } from '@/shared/ui/Decorations';
import { ThemeSwitcher } from '@/features/theme/components/ThemeSwitcher';
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/shared/hooks/useKeyboardShortcuts';
import { useThemeStore } from '@/shared/stores/themeStore';
import { IconButton, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography, Box } from '@mui/material';
import { User, Settings as SettingsIcon, CreditCard, LogOut, BarChart3 } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';

// Import real API hooks
import { useConversations, useConversation, useDeleteConversation, useTokenUsage } from '@/features/chat/hooks/useConversations';
import { useChat } from '@/features/chat/hooks/useChat';
import { useStreamingChat } from '@/features/chat/hooks/useStreamingChat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { validateChatMessage, validateInput } from '@/shared/utils/sanitize';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export function ChatPage() {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();

  // Get real authenticated user
  const { user, logout: authLogout, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Get current theme
  const { themeName: currentTheme } = useThemeStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Refs for focus management
  const chatInputRef = useRef<ChatInputHandle>(null);

  // Flag to prevent auto-loading conversation after clicking "New chat"
  const skipAutoLoadRef = useRef(false);

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Shortcuts help state
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // User menu state
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Chat store (local UI state)
  const {
    activeConversationId,
    setActiveConversation,
    isTyping,
    setIsTyping,
    selectedModel,
    setSelectedModel,
    isMobileSidebarOpen,
    closeMobileSidebar,
  } = useChatStore();

  // Query client for cache management
  const queryClient = useQueryClient();

  // API hooks
  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();
  const { data: currentConversation, isLoading: isLoadingConversation } = useConversation(activeConversationId || undefined);
  const { data: usageData } = useTokenUsage();
  const { sendMessageAsync, isSending } = useChat();
  const deleteConversationMutation = useDeleteConversation();

  // Streaming chat hook
  const {
    isStreaming,
    streamingContent,
    error: streamingError,
    sendStreamingMessage,
    resetStreaming,
  } = useStreamingChat();

  // Toast notifications
  const { toast, showToast, hideToast, showSuccess, showError } = useToast();

  // Optimistic messages - shown immediately before API confirmation
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Convert API messages to component format
  const apiMessages = useMemo<Message[]>(() => {
    // If no active conversation, return empty (for New Chat)
    if (!activeConversationId) return [];

    if (!currentConversation?.messages) return [];

    // CRITICAL FIX: Verify the conversation data matches the active conversation
    // This prevents showing stale cached data from React Query
    if (currentConversation.id !== activeConversationId) return [];

    return currentConversation.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.createdAt),
      tokenCount: msg.tokenCount,
    }));
  }, [activeConversationId, currentConversation]);

  // Merge API messages with optimistic messages and streaming content
  const messages = useMemo<Message[]>(() => {
    const combinedMessages = [...apiMessages, ...optimisticMessages];

    // If streaming, add a temporary assistant message with streaming content
    if (isStreaming && streamingContent) {
      combinedMessages.push({
        id: `streaming-${Date.now()}`,
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date(),
      });
    }

    return combinedMessages;
  }, [apiMessages, optimisticMessages, isStreaming, streamingContent]);

  // Token usage for sidebar
  const tokenUsage = useMemo(() => {
    if (!usageData?.usage) {
      return { used: 0, limit: 100000, planTier: 'free' as const };
    }
    return usageData.usage;
  }, [usageData]);

  // Convert API conversations to sidebar format
  const sidebarConversations = useMemo(() => {
    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      model: conv.model,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv.messages?.length || 0,
    }));
  }, [conversations]);

  // Auto-select first conversation if none selected (but not after clicking "New chat")
  // Also validate that activeConversationId actually exists in the conversation list
  useEffect(() => {
    // ✅ PHASE 3 FIX: Don't run until conversations are loaded
    if (isLoadingConversations) {
      return;
    }

    // ✅ PHASE 3 FIX: Don't auto-load if URL has conversationId
    // URL routing takes precedence - let URL sync effect handle it
    if (urlConversationId) {
      return;
    }

    if (conversations.length === 0) {
      // No conversations - clear active conversation
      if (activeConversationId) {
        setActiveConversation(null);
      }
      return;
    }

    // ✅ FIX: URL is source of truth - don't auto-select without URL
    // When at /chat (no conversationId), keep state as null (show welcome screen)
    // User must explicitly click a conversation or URL must have :conversationId

    // If URL doesn't have conversationId but state has one, clear the state
    if (!urlConversationId && activeConversationId) {
      console.log('[ChatPage] URL is /chat but state has conversation, clearing state');
      setActiveConversation(null);
      return;
    }

    // Check if current activeConversationId exists in the conversations list
    const activeExists = activeConversationId
      ? conversations.some(conv => conv.id === activeConversationId)
      : false;

    // Only clear invalid conversation IDs, don't auto-select
    if (activeConversationId && !activeExists) {
      console.warn(`[ChatPage] Active conversation ${activeConversationId} not found, clearing state`);
      setActiveConversation(null);
    }
  }, [activeConversationId, conversations, urlConversationId, isLoadingConversations, setActiveConversation]);

  // Clear optimistic messages and streaming state when conversation changes
  useEffect(() => {
    setOptimisticMessages([]);
    resetStreaming();
  }, [activeConversationId, resetStreaming]);

  // Hide typing indicator when streaming content appears
  useEffect(() => {
    if (isStreaming && streamingContent) {
      setIsTyping(false);
    }
  }, [isStreaming, streamingContent, setIsTyping]);

  // Sync URL params with store - CRITICAL for Fix #2 (URL routing)
  // When user navigates via browser history or clicks a conversation,
  // this ensures the store is updated to match the URL
  useEffect(() => {
    // ✅ PHASE 2 FIX: Don't run until conversations are loaded
    // This prevents premature redirect when conversations = [] during loading
    if (isLoadingConversations) {
      return;
    }

    // ✅ NEW CHAT FIX: Skip during intentional state transitions (e.g., "New Chat" clicked)
    if (skipAutoLoadRef.current) {
      return;
    }

    // If URL has conversationId param, sync it with the store
    if (urlConversationId && urlConversationId !== activeConversationId) {
      // Only sync if the conversation exists in our list
      const conversationExists = conversations.some(conv => conv.id === urlConversationId);
      if (conversationExists) {
        setActiveConversation(urlConversationId);
      } else {
        // Conversation doesn't exist - redirect to /chat
        // Now safe: we know conversations are fully loaded
        console.warn(`[ChatPage] Conversation ${urlConversationId} from URL not found, redirecting to /chat`);
        navigate('/chat', { replace: true });
        setActiveConversation(null);
      }
    }

    // ✅ NEW CHAT FIX: REMOVED problematic "restore URL" logic
    // Previously had: else if (!urlConversationId && activeConversationId) { navigate(`/chat/${activeConversationId}`) }
    // This caused race condition: "New Chat" navigates to /chat, then this effect reverted it
    // Solution: Only sync URL→State (when URL has ID), never State→URL
    // "New Chat" handler now explicitly navigates to /chat and clears state
  }, [urlConversationId, activeConversationId, conversations, isLoadingConversations, navigate, setActiveConversation]);

  // Handle sending a message with streaming
  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        // Validate input for security
        const validation = validateInput(content, 'message');
        if (!validation.valid) {
          showError(validation.message || 'Invalid message');
          return;
        }

        // Sanitize the message
        const sanitizedMessage = validateChatMessage(content);

        // Clear any previous optimistic messages before adding new one
        // This ensures we don't accumulate stale optimistic messages
        setOptimisticMessages([]);

        // ✨ OPTIMISTIC UI: Show user message immediately
        const optimisticUserMessage: Message = {
          id: `optimistic-${Date.now()}`,
          role: 'user',
          content: sanitizedMessage,
          timestamp: new Date(),
        };

        setOptimisticMessages([optimisticUserMessage]);

        // Show typing indicator while waiting for first chunk
        setIsTyping(true);

        // Track if we've received the first chunk
        let firstChunkReceived = false;

        // ✨ STREAMING: Use streaming API for real-time response
        await sendStreamingMessage(
          sanitizedMessage,
          activeConversationId || undefined,
          selectedModel,
          (result) => {
            // On streaming complete
            // If this was a new conversation, set the active conversation and navigate
            if (!activeConversationId && result.conversationId) {
              navigate(`/chat/${result.conversationId}`);
              setActiveConversation(result.conversationId);
            }

            // FIX: Clear optimistic messages after streaming completes
            // The conversation cache has been refetched in useStreamingChat,
            // so real messages from the backend are now in the cache.
            // Clear optimistic messages immediately since real data is available.
            setOptimisticMessages([]);

            // Ensure typing indicator is hidden
            setIsTyping(false);

            // Focus the input after completion for better UX
            setTimeout(() => {
              chatInputRef.current?.focus();
            }, 100);
          }
        );
      } catch (error) {
        console.error('❌ Failed to send message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
        showError(errorMessage);

        // Clear optimistic messages on error
        setOptimisticMessages([]);
        setIsTyping(false);
      }
    },
    [
      activeConversationId,
      selectedModel,
      sendStreamingMessage,
      setIsTyping,
      showError,
      setActiveConversation,
    ]
  );

  // Handle copy message
  const handleCopy = useCallback(
    (_content: string) => {
      showSuccess('Message copied to clipboard!');
    },
    [showSuccess]
  );

  // Handle regenerate message
  const handleRegenerate = useCallback(
    (_messageId: string) => {
      showToast('Regenerating response...', 'info');
      // TODO: Implement regenerate in future iteration
    },
    [showToast]
  );

  // Handle feedback
  const handleFeedback = useCallback(
    (_messageId: string, type: 'up' | 'down') => {
      showSuccess(`Feedback recorded: ${type === 'up' ? '👍' : '👎'}`);
      // TODO: Send feedback to backend in future iteration
    },
    [showSuccess]
  );

  // Handle conversation click
  const handleConversationClick = useCallback(
    (id: string) => {
      // Navigate to conversation URL for proper browser history
      navigate(`/chat/${id}`);
      setActiveConversation(id);
      closeMobileSidebar();
    },
    [navigate, setActiveConversation, closeMobileSidebar]
  );

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    // Navigate to base /chat URL for new conversation
    navigate('/chat');

    // ✅ FIX: Set flag to prevent auto-loading during transition
    skipAutoLoadRef.current = true;
    // Reset flag after navigation completes
    setTimeout(() => {
      skipAutoLoadRef.current = false;
    }, 100);

    // Clear active conversation - new one will be created on first message
    // No longer need localStorage workaround since activeConversationId is not persisted
    setActiveConversation(null);

    // Clear React Query cache for conversation to remove stale data
    queryClient.removeQueries({ queryKey: ['conversation'] });
    closeMobileSidebar();

    // Clear the chat input
    chatInputRef.current?.clear();

    // Focus the input for better UX
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);

    showSuccess('Ready to start new conversation!');
  }, [navigate, setActiveConversation, queryClient, closeMobileSidebar, showSuccess]);

  // Handle rename conversation
  const handleRenameConversation = useCallback(
    (_id: string) => {
      showToast('Rename feature coming soon!', 'info');
      // TODO: Implement rename API endpoint and functionality
    },
    [showToast]
  );

  // Handle delete conversation
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      if (confirm('Are you sure you want to delete this conversation?')) {
        try {
          await deleteConversationMutation.mutateAsync(id);

          // If we deleted the active conversation, clear it
          if (activeConversationId === id) {
            setActiveConversation(null);
          }

          showSuccess('Conversation deleted!');
        } catch (error) {
          console.error('Failed to delete conversation:', error);
          showError('Failed to delete conversation. Please try again.');
        }
      }
    },
    [
      activeConversationId,
      deleteConversationMutation,
      setActiveConversation,
      showSuccess,
      showError,
    ]
  );

  // Handle pin conversation (local state for now)
  const handlePinConversation = useCallback(
    (_id: string) => {
      showToast('Pin/unpin feature will be connected to backend in next iteration!', 'info');
      // TODO: Implement pin/unpin API endpoint and functionality
    },
    [showToast]
  );

  // Handle file upload (placeholder)
  const handleFileUpload = useCallback(
    (file: File) => {
      showToast(
        `File "${file.name}" selected. Upload will be implemented in Phase 5.`,
        'info'
      );
    },
    [showToast]
  );

  // Handle voice input (placeholder)
  const handleVoiceInput = useCallback(() => {
    showToast('Voice input will be implemented in Phase 5.', 'info');
  }, [showToast]);

  // Handle edit message
  const handleEditMessage = useCallback(
    (_messageId: string) => {
      showToast('Edit message feature will be connected to backend in next iteration!', 'info');
      // TODO: Implement edit message API endpoint and functionality
    },
    [showToast]
  );

  // Handle delete message
  const handleDeleteMessage = useCallback(
    (_messageId: string) => {
      if (confirm('Are you sure you want to delete this message?')) {
        showToast('Delete message feature will be connected to backend in next iteration!', 'info');
        // TODO: Implement delete message API endpoint and functionality
      }
    },
    [showToast]
  );

  // Handle pin message
  const handlePinMessage = useCallback(
    (_messageId: string) => {
      showToast('Pin/unpin message feature will be connected to backend in next iteration!', 'info');
      // TODO: Implement pin/unpin message API endpoint and functionality
    },
    [showToast]
  );

  // Handle settings
  const handleSettingsClick = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const handleExportClose = useCallback(() => {
    setExportMenuAnchor(null);
  }, []);

  // User menu handlers
  const handleUserMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setUserMenuAnchor(null);
  }, []);

  const handleProfileClick = useCallback(() => {
    handleUserMenuClose();
    // TODO: Implement profile page
  }, [handleUserMenuClose]);

  const handleBillingClick = useCallback(() => {
    handleUserMenuClose();
    // TODO: Implement billing page
  }, [handleUserMenuClose]);

  const handleAnalyticsClick = useCallback(() => {
    handleUserMenuClose();
    // TODO: Implement analytics page
  }, [handleUserMenuClose]);

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  // Handle logout - Call real logout API
  const handleLogout = useCallback(async () => {
    console.log('🚪 handleLogout called in ChatPage');
    if (confirm('Are you sure you want to logout?')) {
      try {
        console.log('🔄 Calling authLogout API...');
        await authLogout();
        console.log('✅ authLogout successful, should redirect to login');
        // authLogout will clear the session and navigate to login
      } catch (error) {
        console.error('❌ Logout failed:', error);
        // Even if logout fails, redirect to login
        window.location.href = '/login';
      }
    } else {
      console.log('🚫 User cancelled logout');
    }
  }, [authLogout]);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: 'n',
      ctrlKey: true,
      description: 'New conversation',
      action: handleNewConversation,
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Focus search',
      action: () => {
        // Focus will be handled by the search component
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      },
    },
    {
      key: '/',
      description: 'Focus message input',
      action: () => chatInputRef.current?.focus(),
    },
    {
      key: 'Escape',
      description: 'Close dialogs',
      action: () => {
        setSettingsOpen(false);
        setShortcutsHelpOpen(false);
        setExportMenuAnchor(null);
      },
      preventDefault: false,
    },
    {
      key: ',',
      ctrlKey: true,
      description: 'Open settings',
      action: handleSettingsClick,
    },
    {
      key: 'e',
      ctrlKey: true,
      description: 'Export conversation',
      action: () => {
        if (activeConversationId && messages.length > 0) {
          const exportButton = document.querySelector('[aria-label="Export conversation"]') as HTMLElement;
          exportButton?.click();
        }
      },
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => setShortcutsHelpOpen(true),
    },
  ], [
    handleNewConversation,
    handleSettingsClick,
    activeConversationId,
    messages.length,
  ]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    shortcuts,
  });

  // Show loading spinner while loading auth or initial data
  if (isAuthLoading) {
    return <Spinner fullScreen message="Checking authentication..." />;
  }

  if (isLoadingConversations) {
    return <Spinner fullScreen message="Loading conversations..." />;
  }

  return (
    <>
      {/* Theme-specific Decorative Elements */}
      <ThemeDecorations key={currentTheme} theme={currentTheme} />

      {/* Background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'var(--bg-main)',
          transition: 'background 0.3s ease',
        }}
      />

      <MainLayout
        user={user}
        onLogout={handleLogout}
        onSettingsClick={handleSettingsClick}
        sidebar={
          <ChatSidebar
            conversations={sidebarConversations}
            activeConversationId={activeConversationId ?? undefined}
            onConversationClick={handleConversationClick}
            onNewConversation={handleNewConversation}
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            onPinConversation={handlePinConversation}
            tokenUsage={tokenUsage}
            mobileOpen={isMobileSidebarOpen}
            onMobileClose={closeMobileSidebar}
            userName={user?.name}
            userEmail={user?.email}
            onLogout={handleLogout}
            onSettings={handleSettingsClick}
          />
        }
      >
        {/* Main Chat Container - No Box wrapper */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            position: 'relative',
          }}
        >
          {!activeConversationId ? (
            /* New Chat - Centered Layout */
            <div
              key="new-chat-layout"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                padding: '40px',
                gap: '32px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: 'fadeIn 0.3s ease-in-out',
              }}
            >
              <WelcomeScreen
                onSuggestedPrompt={(prompt) => {
                  handleNewConversation();
                  setTimeout(() => {
                    chatInputRef.current?.setValue(prompt);
                    chatInputRef.current?.focus();
                  }, 100);
                }}
              />

              {/* Centered Chat Input with animation */}
              <div style={{
                width: '100%',
                maxWidth: '800px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <ChatInput
                  ref={chatInputRef}
                  onSend={handleSendMessage}
                  onFileUpload={handleFileUpload}
                  onVoiceInput={handleVoiceInput}
                  disabled={isTyping || isSending}
                  placeholder="Bắt đầu cuộc trò chuyện mới..."
                  messages={messages}
                  conversationId={activeConversationId}
                  userId={user?.id}
                />
              </div>
            </div>
          ) : (
            /* Existing Conversation - Normal Layout */
            <div
              key="conversation-layout"
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Messages */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                position: 'relative',
                zIndex: 100,
                minHeight: 0,
                background: 'transparent',
              }}>
                {isLoadingConversation ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Spinner message="Loading messages..." />
                  </div>
                ) : (
                  <MessageList
                    messages={messages}
                    isTyping={isTyping}
                    onCopy={handleCopy}
                    onRegenerate={handleRegenerate}
                    onFeedback={handleFeedback}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onPin={handlePinMessage}
                  />
                )}
              </div>

              {/* Input Area - Bottom */}
              <ChatInput
                ref={chatInputRef}
                onSend={handleSendMessage}
                onFileUpload={handleFileUpload}
                onVoiceInput={handleVoiceInput}
                disabled={isTyping || isSending}
                placeholder="Bắt đầu cuộc trò chuyện mới..."
                messages={messages}
                conversationId={activeConversationId}
                userId={user?.id}
              />
            </div>
          )}

          {/* Top Bar - Model Selector, Theme Switcher, Avatar - Moved to left, next to sidebar */}
          <div style={{
            position: 'fixed',
            top: '20px',
            left: useChatStore.getState().isSidebarCollapsed ? '80px' : '296px',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '6px 10px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-medium)',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
              }}
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3">Claude 3</option>
            </select>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* User Avatar & Menu */}
            <IconButton onClick={handleUserMenuOpen} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {getUserInitials()}
              </Avatar>
            </IconButton>
          </div>

          {/* User Menu */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: { minWidth: 220 },
            }}
          >
            {/* User Info */}
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>

            <Divider />

            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <User size={18} />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>

            <MenuItem onClick={() => { handleUserMenuClose(); handleSettingsClick(); }}>
              <ListItemIcon>
                <SettingsIcon size={18} />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleBillingClick}>
              <ListItemIcon>
                <CreditCard size={18} />
              </ListItemIcon>
              <ListItemText>Billing</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleAnalyticsClick}>
              <ListItemIcon>
                <BarChart3 size={18} />
              </ListItemIcon>
              <ListItemText>Analytics</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={() => { handleUserMenuClose(); handleLogout(); }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <LogOut size={18} color="currentColor" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </div>
      </MainLayout>

      {/* Toast Notifications */}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={hideToast}
      />

      {/* Settings Panel */}
      <SettingsPanel open={settingsOpen} onClose={handleSettingsClose} />

      {/* Export Menu */}
      {activeConversationId && currentConversation && (
        <ExportMenu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportClose}
          conversationTitle={currentConversation.title}
          messages={messages}
          model={currentConversation.model}
          createdAt={currentConversation.createdAt}
          totalTokens={messages.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0)}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <ShortcutsHelp
        open={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
        shortcuts={shortcuts}
      />
    </>
  );
}
