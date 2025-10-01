import React, { useState, useEffect } from 'react'
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check, Sparkles, FileText, FileSpreadsheet, File, Download } from 'lucide-react'
import Markdown from '@/components/Markdown'
import { Button } from '@/components/ui/button'
import { Message } from '@/components/chat/shared/types'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import styles from '@/styles/components/chat/messages.module.css'

interface MessageBubbleProps {
    message: Message
    isLast: boolean
    onRegenerate?: () => void
    onFeedback?: (type: 'like' | 'dislike') => void
}

export function MessageBubble({ message, isLast, onRegenerate, onFeedback }: MessageBubbleProps) {
    const { copied, copy } = useCopyToClipboard()
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null)
    const isUser = message.role === 'USER'

    // Load existing feedback when component mounts
    useEffect(() => {
        if (!isUser) {
            fetch(`/api/messages/feedback?messageId=${message.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.feedback) {
                        setFeedback(data.feedback)
                    }
                })
                .catch(error => {
                    console.error('Failed to load feedback:', error)
                })
        }
    }, [message.id, isUser])

    const handleCopy = async () => {
        await copy(message.content)
    }

    // Trong MessageBubble.tsx, sửa lại phần feedback handling:
    const handleFeedback = async (type: 'like' | 'dislike') => {
        // Toggle feedback nếu click lại cùng loại
        const newFeedback = feedback === type ? null : type
        setFeedback(newFeedback)

        // Gọi API để lưu feedback
        if (newFeedback) {
            try {
                const response = await fetch('/api/messages/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messageId: message.id,
                        feedback: newFeedback
                    })
                })
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                
                const result = await response.json()
                console.log('Feedback saved:', result)
                onFeedback?.(newFeedback)
            } catch (error) {
                console.error('Failed to save feedback:', error)
                // Revert feedback state on error
                setFeedback(feedback)
            }
        }
    }

    return (
        <div className={`${styles.messageWrapper} ${isUser ? styles.user : styles.assistant}`}>
            <div className={styles.messageContent}>
                {/* Copy button for both user and assistant messages */}
                <button
                    className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                    onClick={handleCopy}
                    aria-label={copied ? "Đã sao chép" : "Sao chép tin nhắn"}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                {isUser ? (
                    <p className={styles.userText}>{message.content}</p>
                ) : (
                    <div className={styles.assistantText}>
                        <Markdown>{message.content}</Markdown>
                    </div>
                )}

                {/* Render attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className={styles.attachments}>
                        {message.attachments.map((attachment) => {
                            const getFileIcon = () => {
                                if (attachment.kind === 'pdf') {
                                    return <FileText size={20} style={{ color: '#e74c3c' }} />
                                } else if (attachment.kind === 'document') {
                                    const mimeType = attachment.meta?.mimeType || ''
                                    if (mimeType.includes('sheet') || mimeType.includes('excel')) {
                                        return <FileSpreadsheet size={20} style={{ color: '#27ae60' }} />
                                    }
                                    return <FileText size={20} style={{ color: '#3498db' }} />
                                }
                                return <File size={20} />
                            }

                            const formatSize = (bytes: number) => {
                                if (bytes < 1024) return bytes + ' B'
                                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
                                return (bytes / 1024 / 1024).toFixed(1) + ' MB'
                            }

                            return (
                                <div key={attachment.id} className={styles.attachment}>
                                    {attachment.kind === 'image' ? (
                                        <img
                                            src={attachment.url}
                                            alt={attachment.meta?.name || 'Generated image'}
                                            className={styles.attachmentImage}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.attachmentFileCard}
                                            download={attachment.meta?.name}
                                        >
                                            <div className={styles.fileIcon}>
                                                {getFileIcon()}
                                            </div>
                                            <div className={styles.fileInfo}>
                                                <div className={styles.fileName}>
                                                    {attachment.meta?.name || 'File'}
                                                </div>
                                                {attachment.meta?.size && (
                                                    <div className={styles.fileSize}>
                                                        {formatSize(attachment.meta.size)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.downloadIcon}>
                                                <Download size={16} />
                                            </div>
                                        </a>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {!isUser && isLast && (
                <div className={styles.messageActions}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRegenerate}
                        className={styles.actionButton}
                        title="Tạo lại phản hồi"
                    >
                        <RefreshCw size={14} />
                        <span className={styles.actionLabel}>Tạo lại</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('like')}
                        className={`${styles.actionButton} ${feedback === 'like' ? styles.active : ''}`}
                        title="Hữu ích"
                    >
                        <ThumbsUp size={14} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('dislike')}
                        className={`${styles.actionButton} ${feedback === 'dislike' ? styles.active : ''}`}
                        title="Không hữu ích"
                    >
                        <ThumbsDown size={14} />
                    </Button>
                </div>
            )}

            {/* Toast notification */}
            {copied && (
                <div className={styles.copyToast}>
                    <Sparkles size={14} />
                    <span>Đã sao chép!</span>
                </div>
            )}
        </div>
    )
}