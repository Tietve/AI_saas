import { Box } from '@mui/material';
import { useState } from 'react';
import { Header } from '../Header/Header';
import { useChatStore } from '@/features/chat/store/chatStore';

interface MainLayoutProps {
  children: React.ReactNode;
  user?: {
    email: string;
    name?: string;
  };
  sidebar?: React.ReactNode;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onBillingClick?: () => void;
  onAnalyticsClick?: () => void;
}

export function MainLayout({
  children,
  user,
  sidebar,
  onLogout,
  onProfileClick,
  onSettingsClick,
  onBillingClick,
  onAnalyticsClick,
}: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSidebarCollapsed } = useChatStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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
