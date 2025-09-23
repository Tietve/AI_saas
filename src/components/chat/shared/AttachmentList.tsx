import React from 'react'
import { File as FileIcon } from 'lucide-react'
import type { Attachment } from './types'

interface AttachmentListProps {
    attachments?: Attachment[]
    role: 'USER' | 'ASSISTANT'
}

function formatFileSize(size?: number) {
    if (!size || size <= 0) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let value = size
    let index = 0
    while (value >= 1024 && index < units.length - 1) {
        value /= 1024
        index += 1
    }
    const precision = value < 10 && index > 0 ? 1 : 0
    return `${value.toFixed(precision)} ${units[index]}`
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ attachments = [], role }) => {
    if (!attachments.length) return null
    const isUser = role === 'USER'

    return (
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
            {attachments.map(att => {
                const meta = att.meta || {}
                const name = typeof meta.name === 'string' ? meta.name : att.url.split('/').pop() || 'Tệp đính kèm'
                const mime = typeof meta.mimeType === 'string' ? meta.mimeType : undefined
                const size = typeof meta.size === 'number' ? meta.size : undefined
                const isImage = att.kind === 'image' || (mime ? mime.startsWith('image/') : false)

                if (isImage) {
                    return (
                        <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group overflow-hidden rounded-2xl border max-w-sm shadow-sm hover:shadow-md transition message-attachment"
                            style={{
                                background: isUser
                                    ? 'linear-gradient(135deg, var(--chat-primary), var(--chat-primary-accent))'
                                    : 'var(--chat-surface-strong)',
                                color: isUser ? 'var(--chat-on-primary)' : 'var(--color-text)',
                                borderColor: isUser ? 'transparent' : 'var(--chat-border)'
                            }}
                        >
                            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <img src={att.url} alt={name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 text-xs"
                                 style={{ color: isUser ? 'var(--chat-on-primary)' : 'var(--chat-muted)' }}
                            >
                                <span className="truncate" title={name}>
                                    {name}
                                </span>
                                {size && <span>{formatFileSize(size)}</span>}
                            </div>
                        </a>
                    )
                }

                return (
                    <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded-2xl border shadow-sm hover:shadow-md transition message-attachment"
                        style={{
                            background: isUser
                                ? 'linear-gradient(135deg, var(--chat-primary), var(--chat-primary-accent))'
                                : 'var(--chat-surface-strong)',
                            color: isUser ? 'var(--chat-on-primary)' : 'var(--color-text)',
                            borderColor: isUser ? 'transparent' : 'var(--chat-border)'
                        }}
                    >
                        <div
                            className="p-2 rounded-xl"
                            style={{
                                background: isUser ? 'rgba(255,255,255,0.15)' : 'var(--chat-surface-soft)',
                                color: isUser ? 'var(--chat-on-primary)' : 'var(--chat-muted)'
                            }}
                        >
                            <FileIcon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-xs">
                            <span className="font-medium truncate" title={name}>
                                {name}
                            </span>
                            {size && (
                                <span style={{ color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--chat-muted)' }}>
                                    {formatFileSize(size)}
                                </span>
                            )}
                        </div>
                    </a>
                )
            })}
        </div>
    )
}
