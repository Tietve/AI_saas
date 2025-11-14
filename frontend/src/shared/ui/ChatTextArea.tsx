import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { useEffect, useRef } from 'react';

interface ChatTextAreaProps extends Omit<TextFieldProps, 'multiline'> {
  onEnterPress?: (e: React.KeyboardEvent) => void;
  maxRows?: number;
}

export function ChatTextArea({
  onEnterPress,
  maxRows = 6,
  ...props
}: ChatTextAreaProps) {
  const textFieldRef = useRef<HTMLDivElement>(null);

  // Auto-resize functionality
  useEffect(() => {
    const textarea = textFieldRef.current?.querySelector('textarea');
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    textarea.addEventListener('input', adjustHeight);
    adjustHeight();

    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [props.value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Enter without Shift = submit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnterPress?.(e);
    }
    props.onKeyDown?.(e);
  };

  return (
    <TextField
      ref={textFieldRef}
      multiline
      maxRows={maxRows}
      {...props}
      onKeyDown={handleKeyDown}
      sx={{
        '& .MuiOutlinedInput-root': {
          padding: '12px 16px',
        },
        '& textarea': {
          resize: 'none',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,.2)',
            borderRadius: '3px',
          },
        },
        ...props.sx,
      }}
    />
  );
}
