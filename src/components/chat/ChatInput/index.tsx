// src/components/chat/ChatInput/index.tsx

import React, { useRef, useEffect } from 'react'
import { InputControls } from './InputControls'

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    onStop: () => void
    isLoading: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
                                                        value,
                                                        onChange,
                                                        onSend,
                                                        onStop,
                                                        isLoading
                                                    }) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Auto-focus on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            onSend()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (value.trim() && !isLoading) {
            onSend()
        }
    }

    return (
        <div className="chat-input-container px-4 lg:px-6 py-4 bg-white dark:bg-gray-950
                      border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <textarea
                            ref={inputRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isLoading ? 'AI đang trả lời...' : 'Nhập tin nhắn của bạn...'}
                            disabled={isLoading}
                            className="chat-input w-full px-4 py-3 pr-24 bg-gray-100 dark:bg-gray-800
                                     border border-gray-200 dark:border-gray-700 rounded-xl
                                     text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                            rows={3}
                        />

                        <InputControls
                            inputLength={value.length}
                            isLoading={isLoading}
                            hasInput={!!value.trim()}
                            onSend={onSend}
                            onStop={onStop}
                        />
                    </div>
                </form>

                <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Nhấn <kbd className="chat-kbd px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl</kbd> +
                        <kbd className="chat-kbd px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs ml-1">Enter</kbd> để gửi
                    </span>
                    {isLoading && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                            AI đang suy nghĩ...
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}