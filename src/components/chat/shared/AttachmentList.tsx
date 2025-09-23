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
        <div className="attachment-list">
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
                            className={`attachment-card ${isUser ? 'attachment-card--user' : ''}`}
                            title={name}
                        >
                            <div className="attachment-image">
                                <img src={att.url} alt={name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex items-center justify-between w-full text-xs mt-2">
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
                        className={`attachment-card ${isUser ? 'attachment-card--user' : ''}`}
                        title={name}
                    >
                        <div className="attachment-card__icon">
                            <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-xs">
                            <div className="font-medium truncate" title={name}>
                                {name}
                            </div>
                            {size && <div className="opacity-75 mt-0.5">{formatFileSize(size)}</div>}
                        </div>
                    </a>
                )
            })}
        </div>
    )
}
