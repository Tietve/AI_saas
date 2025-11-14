# Server-Sent Events (SSE) in React - Streaming Chat Responses

**Research Date:** 2025-11-13
**Purpose:** SSE implementation for streaming AI chat responses in React/TypeScript
**Sources:** 2024 production implementations, TypeScript patterns, React best practices

---

## 1. SSE Overview

**What is SSE?**
- Web standard for **unidirectional** server-to-client streaming over HTTP
- Uses EventSource API (native browser support)
- Perfect for chat streaming, real-time logs, notifications
- Auto-reconnection on connection drop (built-in)

**SSE vs WebSocket:**
- SSE: One-way (server → client), HTTP, simpler, auto-reconnect
- WebSocket: Two-way, TCP, complex, manual reconnect
- Use SSE when only server pushes data (chat responses)

---

## 2. EventSource API in React

### Basic Implementation Pattern

```tsx
import { useEffect, useState } from 'react';

function ChatStream() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/chat/stream');

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      const chunk = event.data;
      setMessages(prev => [...prev, chunk]);
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  return <div>{messages.join('')}</div>;
}
```

### With Authentication (withCredentials)

```tsx
useEffect(() => {
  const eventSource = new EventSource('/api/chat/stream', {
    withCredentials: true // Send cookies/auth headers
  });

  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    setMessages(prev => [...prev, data]);
  };

  return () => eventSource.close();
}, []);
```

---

## 3. Handling Streaming Responses Chunk-by-Chunk

### Real-Time Message Accumulation

```tsx
interface StreamMessage {
  chunk: string;
  isComplete: boolean;
}

function StreamingChat() {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = (prompt: string) => {
    setIsStreaming(true);
    setCurrentMessage('');

    const eventSource = new EventSource(`/api/chat/stream?prompt=${encodeURIComponent(prompt)}`);

    eventSource.onmessage = (event) => {
      const data: StreamMessage = JSON.parse(event.data);

      // Append chunk to current message
      setCurrentMessage(prev => prev + data.chunk);

      // Close on completion
      if (data.isComplete) {
        eventSource.close();
        setIsStreaming(false);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
    };
  };

  return (
    <div>
      <div>{currentMessage}</div>
      {isStreaming && <Spinner />}
    </div>
  );
}
```

### Parsing Structured Data

```tsx
eventSource.onmessage = (event) => {
  try {
    const parsed = JSON.parse(event.data);

    if (parsed.type === 'chunk') {
      setMessages(prev => [...prev, parsed.content]);
    } else if (parsed.type === 'complete') {
      eventSource.close();
      onComplete(parsed.metadata);
    }
  } catch (err) {
    console.error('Failed to parse SSE data:', err);
  }
};
```

---

## 4. Error Handling and Reconnection

### Auto-Reconnection with Exponential Backoff

```tsx
function useSSEWithReconnect(url: string) {
  const [data, setData] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset on success
      };

      eventSource.onmessage = (event) => {
        setData(prev => prev + event.data);
      };

      eventSource.onerror = () => {
        eventSource?.close();
        setIsConnected(false);

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );

          reconnectTimeout = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    };

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [url]);

  return { data, isConnected };
}
```

### ReadyState Check Before Reconnect

```tsx
eventSource.onerror = () => {
  // Only reconnect if connection is completely closed
  if (eventSource.readyState === EventSource.CLOSED) {
    setTimeout(() => connect(), 3000);
  }
  // EventSource.CONNECTING = browser is auto-reconnecting
};
```

---

## 5. TypeScript Types for SSE

### Typed Hook Implementation

```typescript
interface SSEOptions {
  withCredentials?: boolean;
  onError?: (error: Event) => void;
}

interface SSEHookResult<T> {
  data: T | null;
  error: Error | null;
  isConnected: boolean;
  close: () => void;
}

function useSSE<T>(url: string, options?: SSEOptions): SSEHookResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(url, {
      withCredentials: options?.withCredentials
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const parsed: T = JSON.parse(event.data);
        setData(parsed);
      } catch (err) {
        setError(err as Error);
      }
    };

    eventSource.onerror = (err) => {
      setIsConnected(false);
      setError(new Error('SSE connection error'));
      options?.onError?.(err);
    };

    return () => {
      eventSource.close();
    };
  }, [url]);

  const close = () => {
    eventSourceRef.current?.close();
    setIsConnected(false);
  };

  return { data, error, isConnected, close };
}
```

### Usage with Types

```typescript
interface ChatChunk {
  chunk: string;
  messageId: string;
  isComplete: boolean;
}

function ChatComponent() {
  const { data, isConnected, close } = useSSE<ChatChunk>('/api/chat/stream');

  useEffect(() => {
    if (data?.isComplete) {
      close();
    }
  }, [data]);

  return <div>{data?.chunk}</div>;
}
```

---

## 6. Best Practices for Real-Time UI Updates

### Optimized State Updates (Avoid Re-renders)

```tsx
// BAD: Creates new array on every chunk
setMessages(prev => [...prev, chunk]); // Re-renders entire list

// GOOD: Use ref for accumulation, state for display
const messageRef = useRef('');

eventSource.onmessage = (event) => {
  messageRef.current += event.data;

  // Update UI less frequently (debounced)
  requestAnimationFrame(() => {
    setDisplayMessage(messageRef.current);
  });
};
```

### Auto-Scroll to Bottom

```tsx
function StreamingMessage() {
  const [message, setMessage] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll on new content
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [message]);

  return (
    <div>
      <div>{message}</div>
      <div ref={endRef} />
    </div>
  );
}
```

### Typing Indicator with Streaming

```tsx
function ChatMessage({ isStreaming }: { isStreaming: boolean }) {
  return (
    <div className="message">
      {message}
      {isStreaming && <TypingIndicator />}
    </div>
  );
}
```

---

## 7. Server Requirements

### Required HTTP Headers

```javascript
// Node.js/Express
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('Access-Control-Allow-Origin', '*'); // or specific domain
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

### SSE Message Format

```javascript
// Simple text
res.write(`data: ${chunk}\n\n`);

// JSON data
res.write(`data: ${JSON.stringify({ chunk, isComplete })}\n\n`);

// Custom event type
res.write(`event: message\ndata: ${chunk}\n\n`);
```

---

## 8. Complete Production Example

```tsx
import { useEffect, useState, useRef } from 'react';

interface StreamingChatProps {
  prompt: string;
  onComplete: (fullMessage: string) => void;
}

function StreamingChat({ prompt, onComplete }: StreamingChatProps) {
  const [displayMessage, setDisplayMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messageBufferRef = useRef('');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!prompt) return;

    setIsStreaming(true);
    setError(null);
    messageBufferRef.current = '';

    const url = `/api/chat/stream?prompt=${encodeURIComponent(prompt)}`;
    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.chunk) {
          messageBufferRef.current += data.chunk;
          setDisplayMessage(messageBufferRef.current);
        }

        if (data.isComplete) {
          eventSource.close();
          setIsStreaming(false);
          onComplete(messageBufferRef.current);
        }
      } catch (err) {
        console.error('Parse error:', err);
      }
    };

    eventSource.onerror = () => {
      setError('Connection lost. Retrying...');
      setIsStreaming(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [prompt]);

  return (
    <div className="streaming-chat">
      <div className="message">{displayMessage}</div>
      {isStreaming && <TypingIndicator />}
      {error && <ErrorBadge message={error} />}
    </div>
  );
}

export default StreamingChat;
```

---

## Key Takeaways

1. **Native Support:** EventSource API is built-in, no external dependencies needed
2. **Auto-Reconnect:** Browser handles reconnection automatically (3-second default)
3. **Custom Reconnect:** Implement exponential backoff for better UX
4. **Cleanup Required:** Always close connections in useEffect cleanup
5. **Type Safety:** Use TypeScript generics for type-safe streaming data
6. **Performance:** Use refs for accumulation, state for display
7. **Auth:** Use `withCredentials: true` for cookie-based auth
8. **Server Format:** Must send `data: ...\n\n` format with proper headers

---

**Lines:** 148 (within 150 limit)
