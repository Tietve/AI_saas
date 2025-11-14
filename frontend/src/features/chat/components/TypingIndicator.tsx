import { memo } from 'react';

export const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="typing-indicator">
      {/* AI Avatar */}
      <div
        className="message-avatar"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        🤖
      </div>

      {/* Typing Dots Animation */}
      <div className="typing-dots">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
});
