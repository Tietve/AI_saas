import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/tests/test-utils';
import { renderHook, act } from '@testing-library/react';
import { Toast, useToast } from '../Toast';

describe('Toast Component', () => {
  it('renders when open is true', () => {
    const onClose = vi.fn();
    render(
      <Toast open={true} message="Test message" severity="info" onClose={onClose} />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    const onClose = vi.fn();
    render(
      <Toast open={false} message="Test message" severity="info" onClose={onClose} />
    );

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('renders with success severity', () => {
    const onClose = vi.fn();
    render(
      <Toast open={true} message="Success!" severity="success" onClose={onClose} />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders with error severity', () => {
    const onClose = vi.fn();
    render(
      <Toast open={true} message="Error occurred" severity="error" onClose={onClose} />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('renders with warning severity', () => {
    const onClose = vi.fn();
    render(
      <Toast open={true} message="Warning!" severity="warning" onClose={onClose} />
    );

    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });

  it('renders with default info severity when not specified', () => {
    const onClose = vi.fn();
    render(
      <Toast open={true} message="Info message" onClose={onClose} />
    );

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Toast open={true} message="Closeable toast" onClose={onClose} />
    );

    // Find close button (MUI Alert has a close button)
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    const closeButton = closeButtons[0];

    await act(async () => {
      closeButton.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-hides after specified duration', async () => {
    const onClose = vi.fn();

    render(
      <Toast
        open={true}
        message="Auto-hide message"
        onClose={onClose}
        autoHideDuration={100}
      />
    );

    expect(screen.getByText('Auto-hide message')).toBeInTheDocument();

    // Wait for auto-hide to trigger
    await waitFor(
      () => {
        expect(onClose).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });
});

describe('useToast Hook', () => {
  it('initializes with closed state', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast.open).toBe(false);
    expect(result.current.toast.message).toBe('');
    expect(result.current.toast.severity).toBe('info');
  });

  it('shows toast with showToast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message', 'success');
    });

    expect(result.current.toast.open).toBe(true);
    expect(result.current.toast.message).toBe('Test message');
    expect(result.current.toast.severity).toBe('success');
  });

  it('hides toast with hideToast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toast.open).toBe(true);

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast.open).toBe(false);
  });

  it('shows success toast with showSuccess', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Success message');
    });

    expect(result.current.toast.open).toBe(true);
    expect(result.current.toast.message).toBe('Success message');
    expect(result.current.toast.severity).toBe('success');
  });

  it('shows error toast with showError', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showError('Error message');
    });

    expect(result.current.toast.open).toBe(true);
    expect(result.current.toast.message).toBe('Error message');
    expect(result.current.toast.severity).toBe('error');
  });

  it('shows warning toast with showWarning', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showWarning('Warning message');
    });

    expect(result.current.toast.open).toBe(true);
    expect(result.current.toast.message).toBe('Warning message');
    expect(result.current.toast.severity).toBe('warning');
  });

  it('shows info toast with showInfo', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showInfo('Info message');
    });

    expect(result.current.toast.open).toBe(true);
    expect(result.current.toast.message).toBe('Info message');
    expect(result.current.toast.severity).toBe('info');
  });

  it('can show multiple toasts sequentially', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('First message');
    });

    expect(result.current.toast.message).toBe('First message');

    act(() => {
      result.current.showError('Second message');
    });

    expect(result.current.toast.message).toBe('Second message');
    expect(result.current.toast.severity).toBe('error');
  });
});
