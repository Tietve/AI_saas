import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useSmartPrompt } from '@/shared/hooks/useSmartPrompt';
import type { Message } from '@/shared/types';

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileUpload?: (file: File) => void;
  onVoiceInput?: () => void;
  disabled?: boolean;
  placeholder?: string;
  messages?: Message[]; // For smart prompt generation (legacy)
  conversationId?: string | null; // For multi-turn prompt upgrade
  userId?: string; // For multi-turn prompt upgrade
}

export interface ChatInputHandle {
  focus: () => void;
  setValue: (value: string) => void;
  clear: () => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  (
    {
      onSend,
      onFileUpload,
      onVoiceInput,
      disabled,
      placeholder = 'Nhập tin nhắn của bạn...',
      messages = [],
      conversationId,
      userId,
    },
    ref
  ) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Smart prompt generation hook (supports both legacy and new multi-turn API)
    const { isGenerating, generatePrompt, upgradePrompt } = useSmartPrompt({
      conversationId,
      userId,
      onSuccess: (prompt, metadata) => {
        setMessage(prompt);
        // Auto resize after setting prompt
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
        // Focus the textarea
        setTimeout(() => textareaRef.current?.focus(), 50);

        // Log metadata if available (multi-turn)
        if (metadata) {
          console.log('[Prompt Upgrade]', {
            turnNumber: metadata.turnNumber,
            isFirstTurn: metadata.isFirstTurn,
            confidence: metadata.confidence,
            tokensUsed: metadata.tokensUsed,
            latencyMs: metadata.latencyMs,
          });
        }
      },
      onError: (error) => {
        console.error('Failed to generate prompt:', error);
        // You can show a toast here if needed
      },
    });

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      setValue: (value: string) => {
        setMessage(value);
        // Auto resize
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
      },
      clear: () => {
        setMessage('');
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      },
    }));

    const handleSend = () => {
      if (!message.trim() || disabled) return;
      onSend(message);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      // Auto resize - compact max height for better space efficiency
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onFileUpload) {
        onFileUpload(file);
      }
    };

    const handleSmartPrompt = async () => {
      // If userId is provided, use new Multi-Turn API (upgrade current message)
      if (userId) {
        if (isGenerating || !message.trim()) return;
        await upgradePrompt(message);
      } else {
        // Fallback to legacy API (generate from history)
        if (isGenerating || messages.length === 0) return;
        await generatePrompt(messages);
      }
    };

    return (
      <div className="chat-input-wrapper" style={{ padding: '16px 24px 20px', background: 'transparent', borderTop: 'none', transition: 'all 0.3s ease' }}>
        <div className="input-container" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={placeholder}
            rows={1}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '12px 110px 12px 18px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              transition: 'all 0.2s',
              color: 'var(--text-primary)',
              boxShadow: '0 2px 20px rgba(0, 0, 0, 0.04)',
              minHeight: '44px',
              maxHeight: '200px',
              overflowY: 'auto',
              lineHeight: '1.5',
            }}
          />

          <div className="input-actions" style={{ position: 'absolute', right: '10px', top: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Attach Button */}
            {onFileUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  title="Đính kèm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                  </svg>
                </button>
              </>
            )}

            {/* Voice Button */}
            {onVoiceInput && (
              <button
                type="button"
                className="input-icon-btn"
                title="Ghi âm"
                onClick={onVoiceInput}
                disabled={disabled}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  color: 'var(--text-secondary)',
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              </button>
            )}

            {/* Smart Prompt Generator Button */}
            <button
              type="button"
              className="input-icon-btn"
              title={userId ? "Nâng cấp prompt (Multi-Turn RAG)" : "Tạo prompt thông minh (AI)"}
              onClick={handleSmartPrompt}
              disabled={
                disabled ||
                isGenerating ||
                (userId ? !message.trim() : messages.length === 0)
              }
              style={{
                width: '32px',
                height: '32px',
                border: 'none',
                background: isGenerating ? 'var(--primary-500)' : 'transparent',
                cursor: (userId ? !message.trim() : messages.length === 0) || isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'all 0.2s',
                color: isGenerating ? 'white' : 'var(--text-secondary)',
                opacity: (userId ? !message.trim() : messages.length === 0) ? 0.4 : 1,
              }}
            >
              {isGenerating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
            </button>

            {/* Emoji Button */}
            <button
              type="button"
              className="input-icon-btn"
              title="Emoji"
              disabled={disabled}
              style={{
                width: '32px',
                height: '32px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'all 0.2s',
                color: 'var(--text-secondary)',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>

            {/* Send Button */}
            <button
              type="button"
              className="send-btn"
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                color: 'white',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>

          {/* Disclaimer ở dưới input */}
          <p className="input-disclaimer" style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '12px', opacity: 0.5 }}>
            AI có thể mắc lỗi. Hãy kiểm tra kỹ thông tin quan trọng.
          </p>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
