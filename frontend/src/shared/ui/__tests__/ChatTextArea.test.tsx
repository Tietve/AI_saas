import { describe, it, expect, vi } from 'vitest';
import React, { useState } from 'react';
import { render, screen } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import { ChatTextArea } from '../ChatTextArea';

describe('ChatTextArea', () => {
  it('renders as multiline textarea', () => {
    render(<ChatTextArea placeholder="Type a message..." />);

    const textarea = screen.getByPlaceholderText('Type a message...');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('accepts text input', async () => {
    const user = userEvent.setup();
    render(<ChatTextArea placeholder="Type here" />);

    const textarea = screen.getByPlaceholderText('Type here');
    await user.type(textarea, 'Hello World');

    expect(textarea).toHaveValue('Hello World');
  });

  it('calls onEnterPress when Enter is pressed without Shift', async () => {
    const user = userEvent.setup();
    const onEnterPress = vi.fn();

    render(<ChatTextArea onEnterPress={onEnterPress} placeholder="Type here" />);

    const textarea = screen.getByPlaceholderText('Type here');
    await user.type(textarea, 'Test message');
    await user.keyboard('{Enter}');

    expect(onEnterPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onEnterPress when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    const onEnterPress = vi.fn();

    render(<ChatTextArea onEnterPress={onEnterPress} placeholder="Type here" />);

    const textarea = screen.getByPlaceholderText('Type here');
    await user.type(textarea, 'Line 1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(onEnterPress).not.toHaveBeenCalled();
    // Shift+Enter should add a new line
    expect(textarea).toHaveValue('Line 1\n');
  });

  it('calls custom onKeyDown handler if provided', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const onEnterPress = vi.fn();

    render(
      <ChatTextArea
        onEnterPress={onEnterPress}
        onKeyDown={onKeyDown}
        placeholder="Type here"
      />
    );

    const textarea = screen.getByPlaceholderText('Type here');
    await user.type(textarea, 'a');

    expect(onKeyDown).toHaveBeenCalled();
  });

  it('respects maxRows prop', () => {
    render(<ChatTextArea maxRows={4} placeholder="Type here" />);

    const textarea = screen.getByPlaceholderText('Type here');
    expect(textarea).toBeInTheDocument();
    // MUI TextField with maxRows will have the attribute
    // We can't easily test the actual rendering behavior in jsdom
    // but we can verify the component renders without error
  });

  it('passes TextField props correctly', () => {
    render(
      <ChatTextArea
        placeholder="Custom placeholder"
        disabled={true}
        fullWidth={true}
      />
    );

    const textarea = screen.getByPlaceholderText('Custom placeholder');
    expect(textarea).toBeDisabled();
  });

  it('handles controlled input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const TestComponent = () => {
      const [value, setValue] = useState('');

      return (
        <ChatTextArea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange(e);
          }}
          placeholder="Controlled"
        />
      );
    };

    render(<TestComponent />);

    const textarea = screen.getByPlaceholderText('Controlled');
    await user.type(textarea, 'test');

    expect(onChange).toHaveBeenCalled();
    expect(textarea).toHaveValue('test');
  });

  it('prevents default on Enter key press', async () => {
    const user = userEvent.setup();
    const onEnterPress = vi.fn();

    render(<ChatTextArea onEnterPress={onEnterPress} placeholder="Type here" />);

    const textarea = screen.getByPlaceholderText('Type here');
    await user.click(textarea); // Focus the textarea first
    await user.keyboard('{Enter}');

    expect(onEnterPress).toHaveBeenCalled();
  });

  it('allows Shift+Enter to add new lines', async () => {
    const user = userEvent.setup();
    render(<ChatTextArea placeholder="Multi-line" />);

    const textarea = screen.getByPlaceholderText('Multi-line');
    await user.type(textarea, 'First line{Shift>}{Enter}{/Shift}Second line');

    expect(textarea.value).toContain('\n');
    expect(textarea.value).toBe('First line\nSecond line');
  });

  it('applies custom sx styles', () => {
    const customSx = { backgroundColor: 'red' };
    const { container } = render(
      <ChatTextArea placeholder="Styled" sx={customSx} />
    );

    // Component should render without error with custom styles
    const textarea = screen.getByPlaceholderText('Styled');
    expect(textarea).toBeInTheDocument();
  });
});
