import { Container, Typography, Paper, Box } from '@mui/material';
import { ChatInput, type ChatInputHandle } from '@/features/chat/components/ChatInput';
import { useRef, useState } from 'react';
import type { Message } from '@/shared/types';

// Mock messages for testing smart prompt
const mockMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'What is React?',
    timestamp: new Date(),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'React is a JavaScript library for building user interfaces...',
    timestamp: new Date(),
  },
  {
    id: '3',
    role: 'user',
    content: 'Can you explain hooks?',
    timestamp: new Date(),
  },
  {
    id: '4',
    role: 'assistant',
    content: 'Hooks are functions that let you use state and other React features...',
    timestamp: new Date(),
  },
];

export function ChatInputTestPage() {
  const chatInputRef = useRef<ChatInputHandle>(null);
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  const handleSend = (message: string) => {
    console.log('Message sent:', message);
    setSentMessages((prev) => [...prev, message]);
    chatInputRef.current?.clear();
  };

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name);
  };

  const handleVoiceInput = () => {
    console.log('Voice input triggered');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}>
        ChatInput Test - Smart Prompt Generator ⭐
      </Typography>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: '#e3f2fd',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Testing Instructions:
        </Typography>
        <ul>
          <li>
            <strong>⭐ Star Button:</strong> Click the star button to generate a smart prompt based on conversation context
          </li>
          <li>
            <strong>State:</strong> Button should be disabled when there are no messages in context
          </li>
          <li>
            <strong>Loading:</strong> Shows spinning loader icon when generating
          </li>
          <li>
            <strong>Auto-fill:</strong> Generated prompt should auto-fill the input box
          </li>
        </ul>
      </Paper>

      <Paper elevation={0} sx={{ bgcolor: 'var(--bg-secondary, #f5f5f5)', p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Mock Conversation Context ({mockMessages.length} messages)
        </Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
          {mockMessages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                mb: 1,
                p: 1.5,
                bgcolor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {msg.role.toUpperCase()}:
              </Typography>
              <Typography variant="body2">{msg.content}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          ChatInput with Smart Prompt (⭐ button should be visible)
        </Typography>
        <ChatInput
          ref={chatInputRef}
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          onVoiceInput={handleVoiceInput}
          placeholder="Try clicking the ⭐ star button to generate a smart prompt..."
          messages={mockMessages}
        />
      </Box>

      {sentMessages.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, bgcolor: '#e8f5e9' }}>
          <Typography variant="h6" gutterBottom>
            Sent Messages Log:
          </Typography>
          {sentMessages.map((msg, index) => (
            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'white', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>#{index + 1}:</strong> {msg}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      <Paper elevation={2} sx={{ p: 3, mt: 4, bgcolor: '#fff3e0' }}>
        <Typography variant="h6" gutterBottom>
          Note:
        </Typography>
        <Typography variant="body2">
          Backend API not yet implemented. Clicking the ⭐ star button will fail with a network error.
          This is expected - we're only testing the UI at this stage.
        </Typography>
      </Paper>
    </Container>
  );
}
