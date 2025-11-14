import { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import { FileText, FileCode, FileJson, Code } from 'lucide-react';
import type { Message } from './MessageItem';
import {
  exportAsText,
  exportAsMarkdown,
  exportAsJSON,
  exportAsHTML,
  estimateFileSize,
  type ExportOptions,
} from '@/shared/utils/export';

interface ExportMenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
  conversationTitle: string;
  messages: Message[];
  model?: string;
  createdAt?: string;
  totalTokens?: number;
}

export function ExportMenu({
  anchorEl,
  open,
  onClose,
  conversationTitle,
  messages,
  model,
  createdAt,
  totalTokens,
}: ExportMenuProps) {
  const [exporting, setExporting] = useState(false);

  const exportOptions: ExportOptions = {
    conversationTitle,
    messages,
    model,
    createdAt,
    totalTokens,
  };

  const handleExport = async (format: 'txt' | 'md' | 'json' | 'html') => {
    try {
      setExporting(true);

      // Add slight delay for better UX (shows loading state)
      await new Promise((resolve) => setTimeout(resolve, 300));

      switch (format) {
        case 'txt':
          exportAsText(exportOptions);
          break;
        case 'md':
          exportAsMarkdown(exportOptions);
          break;
        case 'json':
          exportAsJSON(exportOptions);
          break;
        case 'html':
          exportAsHTML(exportOptions);
          break;
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const getFileSize = (format: 'txt' | 'md' | 'json' | 'html') => {
    return estimateFileSize(exportOptions, format);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          minWidth: 220,
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Export Conversation
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Divider />

      {/* Plain Text */}
      <MenuItem onClick={() => handleExport('txt')} disabled={exporting}>
        <ListItemIcon>
          <FileText size={18} />
        </ListItemIcon>
        <ListItemText
          primary="Plain Text"
          secondary={`~${getFileSize('txt')} KB`}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
      </MenuItem>

      {/* Markdown */}
      <MenuItem onClick={() => handleExport('md')} disabled={exporting}>
        <ListItemIcon>
          <FileCode size={18} />
        </ListItemIcon>
        <ListItemText
          primary="Markdown"
          secondary={`~${getFileSize('md')} KB`}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
      </MenuItem>

      {/* HTML */}
      <MenuItem onClick={() => handleExport('html')} disabled={exporting}>
        <ListItemIcon>
          <Code size={18} />
        </ListItemIcon>
        <ListItemText
          primary="HTML"
          secondary={`~${getFileSize('html')} KB`}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
      </MenuItem>

      <Divider />

      {/* JSON */}
      <MenuItem onClick={() => handleExport('json')} disabled={exporting}>
        <ListItemIcon>
          <FileJson size={18} />
        </ListItemIcon>
        <ListItemText
          primary="JSON"
          secondary={`~${getFileSize('json')} KB • For developers`}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
      </MenuItem>
    </Menu>
  );
}
