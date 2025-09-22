import React from 'react'

interface SystemPromptBarProps {
    show: boolean
    systemPrompt: string
    onSystemPromptChange: (prompt: string) => void
    disabled: boolean
    botName?: string
}

export const SystemPromptBar: React.FC<SystemPromptBarProps> = ({
                                                                    show,
                                                                    systemPrompt,
                                                                    onSystemPromptChange,
                                                                    disabled,
                                                                    botName
                                                                }) => {
    if (!show) return null

    return (
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/10
                      border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    System Prompt:
                </label>
                <input
                    type="text"
                    placeholder="Nhập system prompt tùy chỉnh (ví dụ: You are a helpful assistant...)"
                    value={systemPrompt}
                    onChange={(e) => onSystemPromptChange(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800
                             border border-blue-300 dark:border-blue-700 rounded-lg
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={disabled}
                />
                {botName && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                        (Đang dùng prompt của {botName})
                    </span>
                )}
            </div>
        </div>
    )
}
