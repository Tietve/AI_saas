import React, { useState } from 'react'
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from 'lucide-react'
import Markdown from '@/components/Markdown'
import { Button } from '@/components/ui/button'
import { Message } from '@/components/chat/shared/types'
import styles from '@/styles/components/chat/messages.module.css'

interface MessageBubbleProps {
    message: Message
    isLast: boolean
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === 'USER'

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={`${styles.messageWrapper} ${isUser ? styles.user : styles.assistant}`}>
            <div className={styles.messageContent}>
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
                        icon={copied ? <Check size={14} /> : <Copy size={14} />}
                        onClick={handleCopy}
                        className={styles.actionButton}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<RefreshCw size={14} />}
                        className={styles.actionButton}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<ThumbsUp size={14} />}
                        className={styles.actionButton}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<ThumbsDown size={14} />}
                        className={styles.actionButton}
                    />
                </div>
            )}
        </div>
    )
}