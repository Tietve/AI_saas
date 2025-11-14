import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search, X } from 'lucide-react';

interface ConversationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ConversationSearch({
  value,
  onChange,
  placeholder = 'Search conversations...',
}: ConversationSearchProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <TextField
      fullWidth
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search size={16} style={{ opacity: 0.6 }} />
          </InputAdornment>
        ),
        endAdornment: value && (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleClear} aria-label="Clear search">
              <X size={14} />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          fontSize: '13px',
          transition: 'all 0.2s ease',
          '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.15)',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: '1px',
          },
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.08)',
          },
          '& input': {
            color: 'var(--text-sidebar)',
            padding: '8px 0',
            '&::placeholder': {
              color: 'var(--text-sidebar-secondary)',
              opacity: 1,
            },
          },
        },
      }}
    />
  );
}
