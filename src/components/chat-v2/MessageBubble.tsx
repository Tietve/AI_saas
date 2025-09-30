import React, { useState } from 'react'
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check, Sparkles } from 'lucide-react'
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

    const handleCopy = async () => {
        await copy(message.content)
    }

    const handleFeedback = (type: 'like' | 'dislike') => {
        setFeedback(type)
        onFeedback?.(type)
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
                        {message.attachments.map((attachment) => (
                            <div key={attachment.id} className={styles.attachment}>
                                {attachment.kind === 'image' ? (
                                    <img
                                        src={attachment.url}
                                        alt={attachment.meta?.name || 'Generated image'}
                                        className={styles.attachmentImage}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className={styles.attachmentFile}>
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.attachmentLink}
                                        >
                                            {attachment.meta?.name || 'File'}
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
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