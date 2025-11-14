import { Snackbar, Alert } from '@mui/material';
import type { AlertColor, SnackbarProps } from '@mui/material';

interface ToastProps extends Omit<SnackbarProps, 'open'> {
  open: boolean;
  message: string;
  severity?: AlertColor;
  onClose: () => void;
}

export function Toast({
  open,
  message,
  severity = 'info',
  onClose,
  autoHideDuration = 6000,
  ...props
}: ToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      {...props}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

// Hook for easier toast management
import { useState, useCallback } from 'react';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
    setToast({ open: true, message, severity });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess: (message: string) => showToast(message, 'success'),
    showError: (message: string) => showToast(message, 'error'),
    showWarning: (message: string) => showToast(message, 'warning'),
    showInfo: (message: string) => showToast(message, 'info'),
  };
}
