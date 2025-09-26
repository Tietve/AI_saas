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
    console.log('[AttachmentList] Rendering:', { attachments, role })
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
                    console.log('[AttachmentList] Rendering image:', { id: att.id, url: att.url, name, meta })
                    return (
                        <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group overflow-hidden rounded-2xl border ${
                                isUser
                                    ? 'border-blue-500/40 bg-blue-500/10 text-white'
                                    : 'border-gray-200 bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                            } max-w-sm shadow-sm hover:shadow-md transition`}
                        >
                            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                                <img 
                                    src={att.url} 
                                    alt={name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        console.error('Failed to load image:', att.url, e)
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                    }}
                                    onLoad={() => {
                                        console.log('Image loaded successfully:', att.url)
                                    }}
                                />
                                <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                    <div className="text-center text-gray-500 dark:text-gray-400">
                                        <div className="text-sm">Failed to load image</div>
                                        <div className="text-xs mt-1">Click to view original</div>
                                    </div>
                                </div>
                            </div>
                            {/* Hide caption under assistant-generated images for cleaner UI */}
                            {!isUser && false && (
                                <div className={`flex items-center justify-between px-3 py-2 text-xs ${
                                    isUser ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'
                                }`}
                                >
                                    <span className="truncate" title={name}>
                                        {name}
                                    </span>
                                    {size && <span>{formatFileSize(size)}</span>}
                                </div>
                            )}
                        </a>
                    )
                }

                return (
                    <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 px-3 py-2 rounded-2xl border shadow-sm hover:shadow-md transition ${
                            isUser
                                ? 'bg-blue-600 text-white border-blue-500/50'
                                : 'bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                        }`}
                    >
                        <div
                            className={`p-2 rounded-xl ${
                                isUser ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            <FileIcon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-xs">
                            <span className="font-medium truncate" title={name}>
                                {name}
                            </span>
                            {size && (
                                <span className={isUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}>
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
