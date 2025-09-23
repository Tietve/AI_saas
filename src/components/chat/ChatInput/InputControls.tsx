

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
                className="chat-button stop-control"
            >
                <Square className="w-4 h-4" />
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
            className={`chat-button send-control ${hasInput && !disabled ? 'is-ready' : 'is-disabled'}`}>
            <Send className="w-4 h-4" />
        </button>
    )
}