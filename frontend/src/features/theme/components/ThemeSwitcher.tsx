import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Palette,
  Check,
  Moon,
  Sun,
} from 'lucide-react';
import { useThemeStore } from '@/shared/stores/themeStore';
import { themeNames, themeDisplayNames } from '@/shared/config/theme';
import type { ThemeName } from '@/shared/config/theme';

const themeIcons: Record<ThemeName, string> = {
  default: '🌲',
  ocean: '🌊',
  purple: '💜',
  orange: '🌅',
  rose: '🌹',
  lavender: '💐',
  mint: '🌿',
  coral: '🪸',
  white: '⚪',
  black: '⚫',
};

export function ThemeSwitcher() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { themeName, darkMode, setTheme, toggleDarkMode } = useThemeStore();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (theme: ThemeName) => {
    setTheme(theme);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        sx={{
          color: 'var(--text-sidebar)',
        }}
        aria-label="Change theme"
      >
        <Palette />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 220,
            maxHeight: 400,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Choose Theme
          </Typography>
        </Box>

        <Divider />

        {themeNames.map((theme) => (
          <MenuItem
            key={theme}
            selected={themeName === theme}
            onClick={() => handleThemeSelect(theme)}
          >
            <ListItemIcon>
              <Box sx={{ fontSize: '1.5rem' }}>{themeIcons[theme]}</Box>
            </ListItemIcon>
            <ListItemText>{themeDisplayNames[theme]}</ListItemText>
            {themeName === theme && (
              <Check size={20} style={{ marginLeft: 8 }} />
            )}
          </MenuItem>
        ))}

        <Divider />

        <MenuItem onClick={toggleDarkMode}>
          <ListItemIcon>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </ListItemIcon>
          <ListItemText>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
