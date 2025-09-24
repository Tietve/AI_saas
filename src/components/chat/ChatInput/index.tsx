

import React, { useRef, useEffect, useState } from 'react'
import { InputControls } from './InputControls'
import { Paperclip, Smile, Mic, X, Loader2, File as FileIcon, Send, Square, MoreHorizontal, ThumbsUp, ThumbsDown, Copy, Share2, Bookmark, Flag } from 'lucide-react'
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
                                                        isUploading
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
        <div className="chat-input-container border-t border-gray-200 dark:border-gray-800
                        bg-white dark:bg-gray-950">
            <form onSubmit={handleSubmit}>
                <div className="px-4 py-3">
                        <div className="max-w-4xl mx-auto transition-all duration-300">
                        <div className="relative">
                            {}
                            <div className={`
                                flex flex-col gap-2 bg-gray-100 dark:bg-gray-800
                                rounded-2xl px-3 py-2 transition-all
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                ${!disabled && !isLoading ? 'hover:bg-gray-50 dark:hover:bg-gray-800/70' : ''}
                                focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-gray-900
                            `}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                    aria-label="Chọn tệp đính kèm"
                                    title="Chọn tệp đính kèm"
                                />

                                <div className="flex items-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleFileSelect}
                                        disabled={disabled || isLoading || isUploading}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                             hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                                        title="Đính kèm file">
                                        {isUploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Paperclip className="w-5 h-5" />
                                        )}
                                    </button>


                                <textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        disabled
                                            ? 'Đã hết lượt chat hôm nay...'
                                            : isLoading
                                                ? 'AI đang trả lời...'
                                                : 'Nhập tin nhắn của bạn...'
                                    }
                                    disabled={disabled || isLoading}
                                    rows={rows}
                                    className="flex-1 bg-transparent resize-none outline-none
                                             text-sm text-gray-900 dark:text-white
                                             placeholder-gray-500 dark:placeholder-gray-400
                                             disabled:cursor-not-allowed
                                             min-h-[24px] max-h-[144px]"
                                    style={{
                                        lineHeight: '24px',
                                        overflowY: rows > 5 ? 'auto' : 'hidden'
                                    }}
                                    aria-label="Nhập tin nhắn của bạn"
                                />

                                <div className="flex items-end gap-1">
                                    {}
                                    <button
                                        type="button"
                                        disabled={disabled || isLoading}
                                        className="hidden sm:block p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                                 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                                        title="Emoji">
                                        <Smile className="w-5 h-5" />
                                    </button>

                                    {}
                                    <button
                                        type="button"
                                        disabled={disabled || isLoading}
                                        className="hidden sm:block p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                                 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                                        title="Ghi âm">
                                        <Mic className="w-5 h-5" />
                                    </button>

                                    {}
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

                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {attachments.map(att => {
                                            const meta = att.meta || {}
                                            const name = typeof meta.name === 'string' ? meta.name : att.url.split('/').pop() || 'Tệp đính kèm'
                                            const size = typeof meta.size === 'number' ? meta.size : undefined
                                            const mime = typeof meta.mimeType === 'string' ? meta.mimeType : undefined
                                            const isImage = att.kind === 'image' || (mime ? mime.startsWith('image/') : false)

                                            return (
                                                <div
                                                    key={att.id}
                                                    className="relative group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60"
                                                >
                                                    {isImage ? (
                                                        <div className="w-32 h-24 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                            <img
                                                                src={att.url}
                                                                alt={name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-32 h-24 flex flex-col items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                                                                <FileIcon className="w-4 h-4" />
                                                            </div>
                                                            <span className="px-2 text-center text-xs max-h-[32px] overflow-hidden text-ellipsis">{name}</span>
                                                            {size && (
                                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatSize(size)}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemoveAttachment(att.id)}
                                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                                                        aria-label="Xóa tệp đính kèm"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    <div className="absolute inset-x-0 bottom-0 bg-white/80 dark:bg-gray-900/80 text-[10px] px-2 py-1 text-gray-600 dark:text-gray-300 truncate">
                                                        {name}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {}
                        <div className="flex items-center justify-between mt-2 px-1">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {disabled ? (
                                    <span className="text-red-500">Hết lượt chat. Nâng cấp để tiếp tục</span>
                                ) : (
                                    <>
                                        Nhấn <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Ctrl</kbd>
                                        +
                                        <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] ml-0.5">Enter</kbd> để gửi
                                    </>
                                )}
                            </span>
                            {!disabled && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {value.length}/4000
                                </span>
                            )}
                        </div>
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