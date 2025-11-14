import type { Message } from '@/features/chat/components/MessageItem';

export interface ExportOptions {
  conversationTitle: string;
  messages: Message[];
  model?: string;
  createdAt?: string;
  totalTokens?: number;
}

/**
 * Export conversation as plain text
 */
export function exportAsText(options: ExportOptions): void {
  const { conversationTitle, messages, model, createdAt, totalTokens } = options;

  let content = '';

  // Header
  content += `${conversationTitle}\n`;
  content += `${'='.repeat(conversationTitle.length)}\n\n`;

  // Metadata
  if (createdAt) {
    content += `Created: ${new Date(createdAt).toLocaleString()}\n`;
  }
  if (model) {
    content += `Model: ${model}\n`;
  }
  if (totalTokens) {
    content += `Total Tokens: ${totalTokens.toLocaleString()}\n`;
  }
  content += `Messages: ${messages.length}\n\n`;
  content += `${'-'.repeat(50)}\n\n`;

  // Messages
  messages.forEach((message, index) => {
    const role = message.role === 'user' ? 'You' : 'AI';
    const timestamp = message.timestamp.toLocaleString();

    content += `${role} [${timestamp}]${message.isPinned ? ' 📌' : ''}\n`;
    content += `${message.content}\n`;

    if (message.tokenCount) {
      content += `(${message.tokenCount} tokens)\n`;
    }

    if (index < messages.length - 1) {
      content += `\n${'-'.repeat(50)}\n\n`;
    }
  });

  // Footer
  content += `\n\n${'='.repeat(50)}\n`;
  content += `Exported from My SaaS Chat\n`;
  content += `Export Date: ${new Date().toLocaleString()}\n`;

  // Download
  downloadFile(content, `${sanitizeFilename(conversationTitle)}.txt`, 'text/plain');
}

/**
 * Export conversation as Markdown
 */
export function exportAsMarkdown(options: ExportOptions): void {
  const { conversationTitle, messages, model, createdAt, totalTokens } = options;

  let content = '';

  // Header
  content += `# ${conversationTitle}\n\n`;

  // Metadata table
  content += `## Conversation Details\n\n`;
  content += `| Field | Value |\n`;
  content += `|-------|-------|\n`;
  if (createdAt) {
    content += `| Created | ${new Date(createdAt).toLocaleString()} |\n`;
  }
  if (model) {
    content += `| Model | ${model} |\n`;
  }
  if (totalTokens) {
    content += `| Total Tokens | ${totalTokens.toLocaleString()} |\n`;
  }
  content += `| Messages | ${messages.length} |\n\n`;

  content += `---\n\n`;

  // Messages
  content += `## Messages\n\n`;

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? '**You**' : '**AI Assistant**';
    const timestamp = message.timestamp.toLocaleString();
    const pinned = message.isPinned ? ' 📌 *Pinned*' : '';

    content += `### ${index + 1}. ${role}${pinned}\n\n`;
    content += `*${timestamp}*\n\n`;
    content += `${message.content}\n\n`;

    if (message.tokenCount) {
      content += `> 🔢 Tokens: ${message.tokenCount}\n\n`;
    }

    content += `---\n\n`;
  });

  // Footer
  content += `\n---\n\n`;
  content += `*Exported from My SaaS Chat on ${new Date().toLocaleString()}*\n`;

  // Download
  downloadFile(content, `${sanitizeFilename(conversationTitle)}.md`, 'text/markdown');
}

/**
 * Export conversation as JSON
 */
export function exportAsJSON(options: ExportOptions): void {
  const { conversationTitle, messages, model, createdAt, totalTokens } = options;

  const data = {
    title: conversationTitle,
    model,
    createdAt,
    totalTokens,
    messageCount: messages.length,
    exportedAt: new Date().toISOString(),
    messages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      tokenCount: msg.tokenCount,
      isPinned: msg.isPinned,
    })),
  };

  const content = JSON.stringify(data, null, 2);

  // Download
  downloadFile(content, `${sanitizeFilename(conversationTitle)}.json`, 'application/json');
}

/**
 * Export conversation as HTML
 */
export function exportAsHTML(options: ExportOptions): void {
  const { conversationTitle, messages, model, createdAt, totalTokens } = options;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(conversationTitle)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin: 0 0 15px 0;
      color: #1976d2;
    }
    .metadata {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      font-size: 14px;
      color: #666;
    }
    .metadata strong {
      color: #333;
    }
    .message {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .message.user {
      border-left: 4px solid #1976d2;
    }
    .message.assistant {
      border-left: 4px solid #2e7d32;
    }
    .message.pinned {
      border-top: 2px solid #ff9800;
      position: relative;
    }
    .message.pinned::before {
      content: '📌';
      position: absolute;
      top: 10px;
      right: 10px;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .role {
      font-weight: 600;
      color: #333;
    }
    .role.user {
      color: #1976d2;
    }
    .role.assistant {
      color: #2e7d32;
    }
    .timestamp {
      font-size: 12px;
      color: #999;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.6;
    }
    .tokens {
      margin-top: 10px;
      font-size: 12px;
      color: #666;
      text-align: right;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(conversationTitle)}</h1>
    <div class="metadata">`;

  if (createdAt) {
    html += `
      <strong>Created:</strong>
      <span>${new Date(createdAt).toLocaleString()}</span>`;
  }
  if (model) {
    html += `
      <strong>Model:</strong>
      <span>${escapeHtml(model)}</span>`;
  }
  if (totalTokens) {
    html += `
      <strong>Total Tokens:</strong>
      <span>${totalTokens.toLocaleString()}</span>`;
  }
  html += `
      <strong>Messages:</strong>
      <span>${messages.length}</span>
    </div>
  </div>

  <div class="messages">`;

  messages.forEach((message) => {
    const roleClass = message.role;
    const roleName = message.role === 'user' ? 'You' : 'AI Assistant';
    const pinnedClass = message.isPinned ? ' pinned' : '';

    html += `
    <div class="message ${roleClass}${pinnedClass}">
      <div class="message-header">
        <span class="role ${roleClass}">${escapeHtml(roleName)}</span>
        <span class="timestamp">${message.timestamp.toLocaleString()}</span>
      </div>
      <div class="content">${escapeHtml(message.content)}</div>`;

    if (message.tokenCount) {
      html += `
      <div class="tokens">🔢 ${message.tokenCount} tokens</div>`;
    }

    html += `
    </div>`;
  });

  html += `
  </div>

  <div class="footer">
    Exported from My SaaS Chat on ${new Date().toLocaleString()}
  </div>
</body>
</html>`;

  // Download
  downloadFile(html, `${sanitizeFilename(conversationTitle)}.html`, 'text/html');
}

/**
 * Download file to user's device
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .substring(0, 200); // Limit length
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get file size estimate in KB
 */
export function estimateFileSize(options: ExportOptions, format: 'txt' | 'md' | 'json' | 'html'): number {
  let content = '';

  switch (format) {
    case 'txt':
      content = options.messages.map((m) => m.content).join('\n\n');
      break;
    case 'md':
      content = options.messages.map((m) => m.content).join('\n\n');
      break;
    case 'json':
      content = JSON.stringify(options.messages);
      break;
    case 'html':
      content = options.messages.map((m) => m.content).join('\n\n');
      content += '<html><head></head><body></body></html>'; // Add HTML overhead
      break;
  }

  // Rough estimate in KB
  return Math.ceil(new Blob([content]).size / 1024);
}
