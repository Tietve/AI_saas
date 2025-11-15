import { Box } from '@mui/material';
import { useChatStore } from '@/features/chat/store/chatStore';

/**
 * MainLayout - Simplified layout without header
 *
 * Provides a flexible layout with optional sidebar and main content area.
 * The header component was intentionally removed from this layout.
 *
 * @param children - Main content to render
 * @param sidebar - Optional sidebar component
 */
interface MainLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function MainLayout({
  children,
  sidebar,
}: MainLayoutProps) {
  const { isSidebarCollapsed } = useChatStore();

  const sidebarWidth = isSidebarCollapsed ? 64 : 280;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      {sidebar}

      {/* Main Content - No Header */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'transparent',
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
