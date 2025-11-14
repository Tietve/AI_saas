import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
} from '@mui/material';
import { X, Keyboard } from 'lucide-react';
import { formatShortcut, type KeyboardShortcut } from '@/shared/hooks/useKeyboardShortcuts';

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function ShortcutsHelp({ open, onClose, shortcuts }: ShortcutsHelpProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    // Determine category based on description
    let category = 'Other';

    if (shortcut.description.toLowerCase().includes('conversation') ||
        shortcut.description.toLowerCase().includes('new')) {
      category = 'Conversation';
    } else if (shortcut.description.toLowerCase().includes('search') ||
               shortcut.description.toLowerCase().includes('focus')) {
      category = 'Navigation';
    } else if (shortcut.description.toLowerCase().includes('settings') ||
               shortcut.description.toLowerCase().includes('help') ||
               shortcut.description.toLowerCase().includes('export')) {
      category = 'Actions';
    }

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categoryOrder = ['Conversation', 'Navigation', 'Actions', 'Other'];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Keyboard size={24} />
          <Typography variant="h6" component="span" sx={{ flex: 1 }}>
            Keyboard Shortcuts
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close shortcuts help">
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {categoryOrder.map((category) => {
          const categoryShortcuts = groupedShortcuts[category];
          if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

          return (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" sx={{ mb: 1.5 }}>
                {category}
              </Typography>

              <Table size="small">
                <TableBody>
                  {categoryShortcuts.map((shortcut, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        '&:last-child td': { border: 0 },
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <TableCell sx={{ py: 1.5, borderBottom: 0 }}>
                        <Typography variant="body2">
                          {shortcut.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5, borderBottom: 0 }}>
                        <Chip
                          label={formatShortcut(shortcut)}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          );
        })}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ textAlign: 'center', opacity: 0.7 }}>
          <Typography variant="caption">
            Press <strong>?</strong> anytime to view these shortcuts
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
