/**
 * Export Utilities for Conversations
 * Supports: PDF, Markdown, JSON with Vietnamese text
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Message } from '@/components/chat/shared/types';

export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'html';

export interface ExportOptions {
    format: ExportFormat;
    conversationTitle?: string;
    includeTimestamps?: boolean;
    includeMetadata?: boolean;
    theme?: 'light' | 'dark';
}

export interface BatchExportOptions extends ExportOptions {
    conversations: Array<{
        id: string;
        title: string;
        messages: Message[];
    }>;
}

/**
 * Format date to Vietnamese locale
 */
function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}

/**
 * Sanitize filename to be safe for all OS
 */
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '_')
        .substring(0, 200);
}

/**
 * Download file helper
 */
function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export as Markdown with enhanced formatting
 */
export function exportAsMarkdown(
    messages: Message[],
    options: ExportOptions
): void {
    const { conversationTitle = 'Conversation', includeTimestamps = true, includeMetadata = true } = options;

    let markdown = `# ${conversationTitle}\n\n`;

    if (includeMetadata) {
        markdown += `> **Xuất file:** ${formatDate(new Date())}\n`;
        markdown += `> **Số tin nhắn:** ${messages.length}\n\n`;
        markdown += '---\n\n';
    }

    messages.forEach((msg, index) => {
        const role = msg.role === 'USER' ? '👤 **Bạn**' : '🤖 **Trợ lý AI**';
        const timestamp = includeTimestamps ? ` _(${formatDate(msg.createdAt)})_` : '';

        markdown += `### ${role}${timestamp}\n\n`;
        markdown += `${msg.content}\n\n`;

        // Add attachments if any
        if (msg.attachments && msg.attachments.length > 0) {
            markdown += `**📎 Đính kèm:**\n`;
            msg.attachments.forEach(att => {
                markdown += `- ${att.meta?.name || att.kind}\n`;
            });
            markdown += '\n';
        }

        if (index < messages.length - 1) {
            markdown += '---\n\n';
        }
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const filename = sanitizeFilename(`${conversationTitle}.md`);
    downloadFile(blob, filename);
}

/**
 * Export as JSON with full data
 */
export function exportAsJSON(
    messages: Message[],
    options: ExportOptions
): void {
    const { conversationTitle = 'Conversation', includeMetadata = true } = options;

    const data: any = {
        title: conversationTitle,
        exportDate: new Date().toISOString(),
        messageCount: messages.length,
        messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
            attachments: msg.attachments || []
        }))
    };

    if (!includeMetadata) {
        delete data.exportDate;
        delete data.messageCount;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8'
    });
    const filename = sanitizeFilename(`${conversationTitle}.json`);
    downloadFile(blob, filename);
}

/**
 * Export as HTML with styling
 */
export function exportAsHTML(
    messages: Message[],
    options: ExportOptions
): void {
    const { conversationTitle = 'Conversation', includeTimestamps = true, theme = 'light' } = options;

    const styles = `
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif;
                line-height: 1.6;
                color: ${theme === 'dark' ? '#F5F5F5' : '#2D2B26'};
                background: ${theme === 'dark' ? '#0F0F0F' : '#FFFFFF'};
                padding: 40px;
                max-width: 900px;
                margin: 0 auto;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            h1 {
                color: ${theme === 'dark' ? '#E5C8A8' : '#D4A574'};
                margin-bottom: 10px;
                font-size: 32px;
            }
            .metadata {
                color: ${theme === 'dark' ? '#A3A3A3' : '#706F6C'};
                font-size: 14px;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid ${theme === 'dark' ? '#262626' : '#ECECEA'};
            }
            .message {
                margin-bottom: 30px;
                padding: 20px;
                border-radius: 12px;
                background: ${theme === 'dark' ? '#1A1A1A' : '#FAFAF8'};
                border: 1px solid ${theme === 'dark' ? '#262626' : '#ECECEA'};
            }
            .message-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                font-weight: 600;
                color: ${theme === 'dark' ? '#E5C8A8' : '#D4A574'};
            }
            .message-role {
                font-size: 16px;
            }
            .message-timestamp {
                font-size: 12px;
                font-weight: 400;
                color: ${theme === 'dark' ? '#737373' : '#A8A7A4'};
            }
            .message-content {
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .attachments {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid ${theme === 'dark' ? '#262626' : '#ECECEA'};
                font-size: 14px;
            }
            .attachments-title {
                font-weight: 600;
                margin-bottom: 6px;
                color: ${theme === 'dark' ? '#A3A3A3' : '#706F6C'};
            }
            .user-message {
                border-left: 3px solid ${theme === 'dark' ? '#E5C8A8' : '#D4A574'};
            }
            .assistant-message {
                border-left: 3px solid ${theme === 'dark' ? '#059669' : '#10B981'};
            }
            @media print {
                body { padding: 20px; }
                .message { break-inside: avoid; }
            }
        </style>
    `;

    let html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${conversationTitle}</title>
            ${styles}
        </head>
        <body>
            <h1>${conversationTitle}</h1>
            <div class="metadata">
                <div>📅 Xuất file: ${formatDate(new Date())}</div>
                <div>💬 Số tin nhắn: ${messages.length}</div>
            </div>
    `;

    messages.forEach(msg => {
        const role = msg.role === 'USER' ? '👤 Bạn' : '🤖 Trợ lý AI';
        const messageClass = msg.role === 'USER' ? 'user-message' : 'assistant-message';
        const timestamp = includeTimestamps ? `<span class="message-timestamp">${formatDate(msg.createdAt)}</span>` : '';

        html += `
            <div class="message ${messageClass}">
                <div class="message-header">
                    <span class="message-role">${role}</span>
                    ${timestamp}
                </div>
                <div class="message-content">${escapeHtml(msg.content)}</div>
        `;

        if (msg.attachments && msg.attachments.length > 0) {
            html += `
                <div class="attachments">
                    <div class="attachments-title">📎 Đính kèm:</div>
                    <ul>
            `;
            msg.attachments.forEach(att => {
                html += `<li>${escapeHtml(att.meta?.name || att.kind)}</li>`;
            });
            html += `</ul></div>`;
        }

        html += `</div>`;
    });

    html += `
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = sanitizeFilename(`${conversationTitle}.html`);
    downloadFile(blob, filename);
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
 * Export as PDF with Vietnamese font support
 */
export async function exportAsPDF(
    messages: Message[],
    options: ExportOptions
): Promise<void> {
    const { conversationTitle = 'Conversation', includeTimestamps = true } = options;

    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 800px;
        padding: 40px;
        background: white;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #2D2B26;
    `;

    // Build HTML content
    let html = `
        <h1 style="color: #D4A574; margin-bottom: 10px; font-size: 28px;">${conversationTitle}</h1>
        <div style="color: #706F6C; font-size: 12px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #ECECEA;">
            <div>📅 Xuất file: ${formatDate(new Date())}</div>
            <div>💬 Số tin nhắn: ${messages.length}</div>
        </div>
    `;

    messages.forEach((msg, index) => {
        const role = msg.role === 'USER' ? '👤 Bạn' : '🤖 Trợ lý AI';
        const timestamp = includeTimestamps ? `<span style="font-size: 10px; color: #A8A7A4; margin-left: 8px;">${formatDate(msg.createdAt)}</span>` : '';
        const borderColor = msg.role === 'USER' ? '#D4A574' : '#10B981';

        html += `
            <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background: #FAFAF8; border-left: 3px solid ${borderColor};">
                <div style="font-weight: 600; color: ${borderColor}; margin-bottom: 8px; font-size: 14px;">
                    ${role}${timestamp}
                </div>
                <div style="white-space: pre-wrap; word-wrap: break-word; font-size: 12px; line-height: 1.6;">
                    ${escapeHtml(msg.content)}
                </div>
        `;

        if (msg.attachments && msg.attachments.length > 0) {
            html += `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ECECEA; font-size: 11px;">
                    <div style="font-weight: 600; margin-bottom: 4px;">📎 Đính kèm:</div>
                    <ul style="margin-left: 20px;">
            `;
            msg.attachments.forEach(att => {
                html += `<li>${escapeHtml(att.meta?.name || att.kind)}</li>`;
            });
            html += `</ul></div>`;
        }

        html += `</div>`;
    });

    container.innerHTML = html;
    document.body.appendChild(container);

    try {
        // Convert to canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add more pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Save PDF
        const filename = sanitizeFilename(`${conversationTitle}.pdf`);
        pdf.save(filename);

    } finally {
        // Clean up
        document.body.removeChild(container);
    }
}

/**
 * Batch export multiple conversations
 */
export async function batchExport(options: BatchExportOptions): Promise<void> {
    const { conversations, format, includeTimestamps = true, includeMetadata = true } = options;

    if (conversations.length === 0) {
        throw new Error('No conversations to export');
    }

    // For single format batch export
    if (format === 'json') {
        // Export all as single JSON
        const data = {
            exportDate: new Date().toISOString(),
            conversationCount: conversations.length,
            conversations: conversations.map(conv => ({
                id: conv.id,
                title: conv.title,
                messageCount: conv.messages.length,
                messages: conv.messages
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json;charset=utf-8'
        });
        downloadFile(blob, `batch-export-${Date.now()}.json`);

    } else if (format === 'markdown') {
        // Combine all conversations into one markdown
        let markdown = `# Batch Export\n\n`;
        markdown += `> **Xuất file:** ${formatDate(new Date())}\n`;
        markdown += `> **Số hội thoại:** ${conversations.length}\n\n`;
        markdown += '---\n\n';

        conversations.forEach((conv, convIndex) => {
            markdown += `## ${convIndex + 1}. ${conv.title}\n\n`;
            markdown += `> **Số tin nhắn:** ${conv.messages.length}\n\n`;

            conv.messages.forEach((msg, msgIndex) => {
                const role = msg.role === 'USER' ? '👤 **Bạn**' : '🤖 **Trợ lý AI**';
                const timestamp = includeTimestamps ? ` _(${formatDate(msg.createdAt)})_` : '';

                markdown += `### ${role}${timestamp}\n\n`;
                markdown += `${msg.content}\n\n`;

                if (msgIndex < conv.messages.length - 1) {
                    markdown += '---\n\n';
                }
            });

            if (convIndex < conversations.length - 1) {
                markdown += '\n\n---\n\n# \n\n---\n\n';
            }
        });

        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        downloadFile(blob, `batch-export-${Date.now()}.md`);

    } else {
        // For PDF/HTML, export each conversation separately
        for (const conv of conversations) {
            const exportOptions: ExportOptions = {
                format,
                conversationTitle: conv.title,
                includeTimestamps,
                includeMetadata
            };

            if (format === 'pdf') {
                await exportAsPDF(conv.messages, exportOptions);
                // Add delay between exports to avoid browser overload
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else if (format === 'html') {
                exportAsHTML(conv.messages, exportOptions);
            }
        }
    }
}
