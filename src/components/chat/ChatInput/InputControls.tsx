// src/components/chat/ChatInput/InputControls.tsx - REDESIGNED VERSION

import React from 'react'
import { Send, Square } from 'lucide-react'

interface InputControlsProps {
    inputLength: number
    isLoading: boolean
    hasInput: boolean
    onSend: () => void
    onStop: () => void
    disabled?: boolean
}

export const InputControls: React.FC<InputControlsProps> = ({
                                                                inputLength,
                                                                isLoading,
                                                                hasInput,
                                                                onSend,
                                                                onStop,
                                                                disabled = false
                                                            }) => {
    if (isLoading) {
        return (
            <button
                type="button"
                onClick={onStop}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl
                         transition-all duration-200 shadow-sm hover:shadow-md
                         flex items-center justify-center group">
                <Square className="w-4 h-4 fill-current" />
            </button>
        )
    }

    return (
        <button
            type="submit"
            onClick={(e) => {
                e.preventDefault()
                if (hasInput && !disabled) {
                    onSend()
                }
            }}
            disabled={!hasInput || disabled}
            className={`
                p-2 rounded-xl transition-all duration-200
                flex items-center justify-center
                ${hasInput && !disabled
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
            `}>
            <Send className="w-4 h-4" />
        </button>
    )
}