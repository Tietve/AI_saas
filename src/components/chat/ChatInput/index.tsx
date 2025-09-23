import React, { useRef, useEffect, useState } from 'react'
import { InputControls } from './InputControls'
import { Paperclip, Smile, Mic, X, Loader2, File as FileIcon } from 'lucide-react'
import type { Attachment } from '../shared/types'

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    onStop: () => void
    isLoading: boolean
    disabled?: boolean
    attachments: Attachment[]
    onUpload: (files: FileList | File[]) => void | Promise<void>
    onRemoveAttachment: (id: string) => void
    isUploading: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSend,
    onStop,
    isLoading,
    disabled = false,
    attachments,
    onUpload,
    onRemoveAttachment,
    isUploading,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [rows, setRows] = useState(1)

    useEffect(() => {
        if (!disabled) {
            textareaRef.current?.focus()
        }
    }, [disabled])

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            const scrollHeight = textareaRef.current.scrollHeight
            const lineHeight = 24
            const maxRows = 6
            const newRows = Math.min(Math.max(Math.ceil(scrollHeight / lineHeight), 1), maxRows)
            setRows(newRows)
            textareaRef.current.style.height = `${scrollHeight}px`
        }
    }, [value])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            if (!disabled && !isUploading && (value.trim() || attachments.length > 0)) {
                onSend()
            }
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if ((value.trim() || attachments.length > 0) && !isLoading && !disabled && !isUploading) {
            onSend()
        }
    }

    const handleFileSelect = () => {
        if (disabled || isLoading || isUploading) return
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            try {
                await onUpload(files)
            } finally {
                e.target.value = ''
            }
        }
    }

    return (
        <div className="chat-input-container">
            <form onSubmit={handleSubmit}>
                <div className="max-w-3xl mx-auto space-y-3">
                    <div className={`chat-input ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

                        <div className="flex items-end gap-3">
                            <button
                                type="button"
                                onClick={handleFileSelect}
                                disabled={disabled || isLoading || isUploading}
                                className="chat-pill-button"
                                title="Đính kèm file"
                            >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                            </button>

                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    disabled
                                        ? 'Bạn đã sử dụng hết lượt chat hôm nay...'
                                        : isLoading
                                            ? 'AI đang trả lời...'
                                            : 'Nhập tin nhắn của bạn...'
                                }
                                disabled={disabled || isLoading}
                                rows={rows}
                                className="chat-input__textarea"
                                style={{
                                    lineHeight: '24px',
                                    overflowY: rows > 5 ? 'auto' : 'hidden',
                                }}
                            />

                            <div className="chat-input__actions">
                                <button
                                    type="button"
                                    disabled={disabled || isLoading}
                                    className="chat-pill-button hidden sm:inline-flex"
                                    title="Emoji"
                                >
                                    <Smile className="w-5 h-5" />
                                </button>

                                <button
                                    type="button"
                                    disabled={disabled || isLoading}
                                    className="chat-pill-button hidden sm:inline-flex"
                                    title="Ghi âm"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>

                                <InputControls
                                    inputLength={value.length}
                                    isLoading={isLoading}
                                    hasInput={!!value.trim() || attachments.length > 0}
                                    onSend={onSend}
                                    onStop={onStop}
                                    disabled={disabled || isUploading}
                                />
                            </div>
                        </div>
                    </div>

                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {attachments.map(att => {
                                const meta = att.meta || {}
                                const name = typeof meta.name === 'string' ? meta.name : att.url.split('/').pop() || 'Tệp đính kèm'
                                const size = typeof meta.size === 'number' ? meta.size : undefined
                                const mime = typeof meta.mimeType === 'string' ? meta.mimeType : undefined
                                const isImage = att.kind === 'image' || (mime ? mime.startsWith('image/') : false)

                                return (
                                    <div key={att.id} className="chat-attachment">
                                        {isImage ? (
                                            <div className="attachment-image">
                                                <img src={att.url} alt={name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="attachment-card__icon">
                                                <FileIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onRemoveAttachment(att.id)}
                                            className="chat-attachment__remove"
                                            aria-label="Xóa tệp đính kèm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <div className="chat-attachment__meta">
                                            <span className="truncate" title={name}>
                                                {name}
                                            </span>
                                            {size && <span>{formatSize(size)}</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="chat-footer-hint">
                        <span>
                            {disabled ? (
                                <span className="text-red-500 font-medium">Hết lượt chat. Nâng cấp để tiếp tục</span>
                            ) : (
                                <>
                                    Nhấn <kbd>Ctrl</kbd> + <kbd>Enter</kbd> để gửi
                                </>
                            )}
                        </span>
                        {!disabled && <span>{value.length}/4000</span>}
                    </div>
                </div>
            </form>
        </div>
    )
}

function formatSize(bytes: number) {
    if (!bytes || bytes <= 0) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex += 1
    }
    return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`
}
