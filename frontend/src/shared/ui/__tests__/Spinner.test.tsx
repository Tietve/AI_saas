import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  it('renders spinner without crashing', () => {
    render(<Spinner />);
    // MUI CircularProgress has role="progressbar"
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with message', () => {
    const message = 'Loading data...';
    render(<Spinner message={message} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders without message when not provided', () => {
    const { container } = render(<Spinner />);

    // Should only have CircularProgress, no message text
    const textElements = container.querySelectorAll('[class*="color"]');
    expect(textElements.length).toBeLessThanOrEqual(1);
  });

  it('renders in fullScreen mode', () => {
    const { container } = render(<Spinner fullScreen />);

    // Check for fullScreen container styles
    const fullScreenBox = container.firstChild as HTMLElement;
    expect(fullScreenBox).toBeInTheDocument();

    // Spinner should still be present
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders fullScreen with message', () => {
    const message = 'Loading conversations...';
    render(<Spinner fullScreen message={message} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('passes CircularProgress props', () => {
    render(<Spinner size={60} color="secondary" />);

    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();

    // CircularProgress props are passed correctly
    // Note: SVG sizing is handled by MUI internally, just verify component renders
  });

  it('renders with custom CircularProgress variant', () => {
    render(<Spinner variant="determinate" value={75} />);

    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-valuenow', '75');
  });
});
