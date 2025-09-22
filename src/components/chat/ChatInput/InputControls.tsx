import React from 'react'

interface InputControlsProps {
    inputLength: number
    isLoading: boolean
    hasInput: boolean
    onSend: () => void
    onStop: () => void
}

export const InputControls: React.FC<InputControlsProps> = ({
                                                                inputLength,
                                                                isLoading,
                                                                hasInput,
                                                                onSend,
                                                                onStop
                                                            }) => {
    return (
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {inputLength > 0 && (
                <span className="text-xs text-gray-400">
                    {inputLength}
                </span>
            )}

            {isLoading ? (
                <button
                    onClick={onStop}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700
                             text-white rounded-lg transition-colors duration-200
                             flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    <span>Dừng</span>
                </button>
            ) : (
                <button
                    onClick={onSend}
                    disabled={!hasInput}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700
                             hover:from-blue-700 hover:to-blue-800
                             text-white rounded-lg transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center gap-2 hover-scale">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Gửi</span>
                </button>
            )}
        </div>
    )
}