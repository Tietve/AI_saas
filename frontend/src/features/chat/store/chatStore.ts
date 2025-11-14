import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatState {
  // Current active conversation
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;

  // UI state
  isTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;

  // Selected AI model
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Sidebar state
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Mobile sidebar state
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;

  // Reset all state
  reset: () => void;
}

const initialState = {
  activeConversationId: null,
  isTyping: false,
  selectedModel: 'gpt-4o-mini',
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      ...initialState,

      setActiveConversation: (id) => set({ activeConversationId: id }),

      setIsTyping: (isTyping) => set({ isTyping }),

      setSelectedModel: (model) => set({ selectedModel: model }),

      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      toggleMobileSidebar: () =>
        set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

      closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),

      reset: () => set(initialState),
    }),
    {
      name: 'chat-storage',
      // Persist selected model and sidebar state only
      // activeConversationId is controlled by URL, not persisted
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
