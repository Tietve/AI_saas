import { useState, useEffect, useRef } from 'react';

interface InlineRenameInputProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  maxLength?: number;
}

export function InlineRenameInput({
  initialValue,
  onSave,
  onCancel,
  maxLength = 100,
}: InlineRenameInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus and select all text when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSave = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && trimmedValue !== initialValue) {
      onSave(trimmedValue);
    } else {
      onCancel();
    }
  };

  const handleBlur = () => {
    // Save on blur (click outside)
    handleSave();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onClick={(e) => e.stopPropagation()}
      maxLength={maxLength}
      style={{
        width: '100%',
        padding: '4px 8px',
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--text-primary)',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid var(--primary-500)',
        borderRadius: '6px',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
      }}
    />
  );
}
