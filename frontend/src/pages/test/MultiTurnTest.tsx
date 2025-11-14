import { useState } from 'react';
import { ChatInput } from '@/features/chat/components/ChatInput';

export function MultiTurnTestPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [currentConversationId] = useState(`conv_test_${Date.now()}`);
  const userId = 'test_user_playwright';

  const handleSend = (message: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    console.log('[Test] Sent message:', message);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Multi-Turn RAG Prompt Upgrader Test</h1>
      <p>ConversationID: <code>{currentConversationId}</code></p>
      <p>UserID: <code>{userId}</code></p>

      <div style={{ marginTop: '20px', marginBottom: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Type a message in the input below</li>
          <li>Click the ✨ Sparkles button to upgrade the prompt</li>
          <li>Watch the console for metadata (turnNumber, isFirstTurn, etc.)</li>
          <li>Send another message and upgrade again to test multi-turn</li>
        </ol>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Messages:</h3>
        {messages.length === 0 ? (
          <p style={{ color: '#999' }}>No messages yet. Try upgrading a prompt!</p>
        ) : (
          <ul>
            {messages.map((msg, idx) => (
              <li key={idx}>
                <strong>{msg.role}:</strong> {msg.content}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '40px' }}>
        <ChatInput
          onSend={handleSend}
          placeholder="Type your message and click ✨ to upgrade..."
          messages={messages as any}
          conversationId={currentConversationId}
          userId={userId}
        />
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>Expected Behavior:</h3>
        <p><strong>Turn 1:</strong> Full prompt with ROLE/TASK/CONTEXT/FORMAT</p>
        <p><strong>Turn 2+:</strong> Short contextual prompt, NO role repetition</p>
        <p>Check browser console for metadata!</p>
      </div>
    </div>
  );
}
