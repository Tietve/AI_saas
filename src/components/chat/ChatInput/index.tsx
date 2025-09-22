// src/components/chat/ChatInput/index.tsx - REDESIGNED VERSION

import React, { useRef, useEffect, useState } from 'react'
import { InputControls } from './InputControls'
import { Paperclip, Smile, Mic } from 'lucide-react'

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    onStop: () => void
    isLoading: boolean
    disabled?: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
                                                        value,
                                                        onChange,
                                                        onSend,
                                                        onStop,
                                                        isLoading,
                                                        disabled = false
                                                    }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [rows, setRows] = useState(1)

    // Auto-focus on mount
    useEffect(() => {
        if (!disabled) {
            textareaRef.current?.focus()
        }
    }, [disabled])

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            const scrollHeight = textareaRef.current.scrollHeight
            const lineHeight = 24 // Approximate line height
            const maxRows = 6
            const newRows = Math.min(Math.max(Math.ceil(scrollHeight / lineHeight), 1), maxRows)
            setRows(newRows)
            textareaRef.current.style.height = `${scrollHeight}px`
        }
    }, [value])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            if (!disabled && value.trim()) {
                onSend()
            }
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (value.trim() && !isLoading && !disabled) {
            onSend()
        }
    }

    return (
        <div className="chat-input-container border-t border-gray-200 dark:border-gray-800
                        bg-white dark:bg-gray-950">
            <form onSubmit={handleSubmit}>
                <div className="px-4 py-3">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative">
                            {/* Main Input Container */}
                            <div className={`
                                flex items-end gap-2 bg-gray-100 dark:bg-gray-800 
                                rounded-2xl px-3 py-2 transition-all
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                ${!disabled && !isLoading ? 'hover:bg-gray-50 dark:hover:bg-gray-800/70' : ''}
                                focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-gray-900
                            `}>
                                {/* Attachment Button */}
                                <button
                                    type="button"
                                    disabled={disabled || isLoading}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                             hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                                    title="Đính kèm file">
                                    <Paperclip className="w-5 h-5" />
                                </button>

                                {/* Textarea */}
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
                                />

                                {/* Right Controls */}
                                <div className="flex items-end gap-1">
                                    {/* Emoji Button - Hidden on mobile */}
                                    <button
                                        type="button"
                                        disabled={disabled || isLoading}
                                        className="hidden sm:block p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                                 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                                        title="Emoji">
                                        <Smile className="w-5 h-5" />
                                    </button>

                                    {/* Voice Button - Hidden on mobile */}
                                    <button
                                        type="button"
                                        disabled={disabled || isLoading}
                                        className="hidden sm:block p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                                 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                                        title="Ghi âm">
                                        <Mic className="w-5 h-5" />
                                    </button>

                                    {/* Send/Stop Controls */}
                                    <InputControls
                                        inputLength={value.length}
                                        isLoading={isLoading}
                                        hasInput={!!value.trim()}
                                        onSend={onSend}
                                        onStop={onStop}
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Helper Text */}
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