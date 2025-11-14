import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  User,
  Settings,
  CreditCard,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeSwitcher } from '@/features/theme/components/ThemeSwitcher';
import { SidebarToggleButton } from '@/widgets/ChatSidebar/components/SidebarToggleButton';
import { useChatStore } from '@/features/chat/store/chatStore';

interface HeaderProps {
  user?: {
    email: string;
    name?: string;
  };
  onMenuClick?: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onBillingClick?: () => void;
  onAnalyticsClick?: () => void;
}

export function Header({
  user,
  onMenuClick,
  onLogout,
  onProfileClick,
  onSettingsClick,
  onBillingClick,
  onAnalyticsClick,
}: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isSidebarCollapsed } = useChatStore();

  const sidebarWidth = isSidebarCollapsed ? 64 : 280;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (callback?: () => void) => {
    handleMenuClose();
    callback?.();
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        background: 'var(--bg-main)',
        marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        {/* Desktop Sidebar Toggle - Only show when sidebar is collapsed */}
        {!isMobile && isSidebarCollapsed && (
          <Box sx={{ mr: 2 }}>
            <SidebarToggleButton variant="header" />
          </Box>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Spacer - push everything to the right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* User Menu */}
        {user && (
          <>
            <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
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

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { minWidth: 220 },
              }}
            >
              {/* User Info */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {user.name || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>

              <Divider />

              {onProfileClick && (
                <MenuItem onClick={() => handleMenuItemClick(onProfileClick)}>
                  <ListItemIcon>
                    <User size={18} />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
              )}

              {onSettingsClick && (
                <MenuItem onClick={() => handleMenuItemClick(onSettingsClick)}>
                  <ListItemIcon>
                    <Settings size={18} />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
              )}

              {onBillingClick && (
                <MenuItem onClick={() => handleMenuItemClick(onBillingClick)}>
                  <ListItemIcon>
                    <CreditCard size={18} />
                  </ListItemIcon>
                  <ListItemText>Billing</ListItemText>
                </MenuItem>
              )}

              {onAnalyticsClick && (
                <MenuItem onClick={() => handleMenuItemClick(onAnalyticsClick)}>
                  <ListItemIcon>
                    <BarChart3 size={18} />
                  </ListItemIcon>
                  <ListItemText>Analytics</ListItemText>
                </MenuItem>
              )}

              <Divider />

              {onLogout && (
                <MenuItem
                  onClick={() => handleMenuItemClick(onLogout)}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon>
                    <LogOut size={18} color="currentColor" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
