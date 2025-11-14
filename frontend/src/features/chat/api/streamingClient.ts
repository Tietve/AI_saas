/**
 * SSE Streaming Client for Chat
 * Handles Server-Sent Events for real-time AI response streaming
 */

export interface StreamChunk {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  conversationId?: string;
  messageId?: string;
  tokenCount?: number;
  error?: string;
}

export interface StreamCallbacks {
  onChunk: (content: string) => void;
  onDone: (data: { conversationId: string; messageId: string; tokenCount: number }) => void;
  onError: (error: string) => void;
}

/**
 * Send a message and stream the AI response via SSE
 */
export async function streamMessage(
  message: string,
  conversationId: string | undefined,
  model: string | undefined,
  callbacks: StreamCallbacks
): Promise<void> {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const url = `${baseURL}/chat/stream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
    },
    credentials: 'include', // Include httpOnly cookies
    body: JSON.stringify({
      conversationId,
      message,
      model,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body available for streaming');
  }

  // Read the SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true });

      // SSE format: "data: {...}\n\n"
      // Split by double newline to handle multiple events in one chunk
      const events = chunk.split('\n\n').filter(line => line.startsWith('data: '));

      for (const event of events) {
        const jsonStr = event.replace('data: ', '').trim();
        if (!jsonStr) continue;

        try {
          const data: StreamChunk = JSON.parse(jsonStr);

          if (data.type === 'chunk' && data.content) {
            callbacks.onChunk(data.content);
          } else if (data.type === 'done') {
            callbacks.onDone({
              conversationId: data.conversationId!,
              messageId: data.messageId!,
              tokenCount: data.tokenCount!,
            });
          } else if (data.type === 'error') {
            callbacks.onError(data.error || 'Unknown error');
          }
        } catch (parseError) {
          console.error('[StreamingClient] Failed to parse SSE event:', parseError);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
