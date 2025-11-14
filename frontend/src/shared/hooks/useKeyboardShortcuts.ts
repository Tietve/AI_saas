import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook to register keyboard shortcuts
 * Supports Ctrl/Cmd key combinations and modifiers
 */
export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow certain shortcuts even in input fields (like Escape)
      const allowedInInputFields = ['Escape'];

      if (isInputField && !allowedInInputFields.includes(event.key)) {
        return;
      }

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        const keyMatches = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = s.ctrlKey === undefined || s.ctrlKey === event.ctrlKey;
        const metaMatches = s.metaKey === undefined || s.metaKey === event.metaKey;
        const shiftMatches = s.shiftKey === undefined || s.shiftKey === event.shiftKey;
        const altMatches = s.altKey === undefined || s.altKey === event.altKey;

        return keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches;
      });

      if (shortcut) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Get platform-specific modifier key symbol
 */
export function getModifierKey(): 'Ctrl' | 'Cmd' {
  return navigator.platform.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl';
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(getModifierKey());
  }

  if (shortcut.shiftKey) {
    parts.push('Shift');
  }

  if (shortcut.altKey) {
    parts.push('Alt');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}
