

import { Message as MessageType, BotPersonality } from '../shared/types'
import { AVAILABLE_MODELS, PROVIDER_STYLES } from '../shared/constants'
import { formatDate } from '../shared/utils'
import { Check, CheckCheck } from 'lucide-react'

interface MessageProps {
    message: MessageType
    selectedBot?: BotPersonality
    showAvatar?: boolean
}

export function Message({ message, selectedBot, showAvatar = true }: MessageProps) {
    const isUser = message.role === 'USER'
    const model = AVAILABLE_MODELS.find(m => m.id === message.model)

    return (
        <div className={`message-wrapper flex ${isUser ? 'justify-end' : 'justify-start'} 
                        animate-in fade-in slide-in-from-bottom-1 duration-200`}>
            {isUser ? (
                
                <div className="max-w-[85%] lg:max-w-[70%]">
                    <div className="flex flex-col items-end gap-1">
                        <div className="group relative">
                            <div className="bg-blue-600 text-white rounded-2xl px-4 py-2.5 shadow-sm
                                          hover:bg-blue-700 transition-colors">
                                <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                </p>
                            </div>

                            {}
                            <div className="flex items-center gap-1 mt-1 justify-end">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {formatDate(message.createdAt)}
                                </span>
                                {}
                                <CheckCheck className="w-3 h-3 text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                
                <div className="flex gap-3 max-w-[85%] lg:max-w-[70%]">
                    {}
                    {showAvatar && (
                        <div className="flex-shrink-0 pt-0.5">
                            {selectedBot ? (
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xl
                                              bg-gradient-to-br shadow-sm"
                                     style={{
                                         backgroundImage: `linear-gradient(135deg, ${selectedBot.appearance.primaryColor}, ${selectedBot.appearance.secondaryColor})`
                                     }}>
                                    {selectedBot.appearance.emoji}
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600
                                              flex items-center justify-center text-white text-xs font-medium shadow-sm">
                                    AI
                                </div>
                            )}
                        </div>
                    )}

                    {}
                    {!showAvatar && <div className="w-8 flex-shrink-0" />}

                    {}
                    <div className="flex-1">
                        <div className="group relative">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2.5 shadow-sm
                                          border border-gray-100 dark:border-gray-700
                                          hover:shadow-md transition-shadow">
                                <div className="text-sm whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
                                    {message.content}
                                    {message.isStreaming && (
                                        <span className="inline-block w-1 h-4 ml-0.5 bg-gray-400 animate-pulse" />
                                    )}
                                </div>
                            </div>

                            {}
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {formatDate(message.createdAt)}
                                </span>
                                {model && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                                                   ${PROVIDER_STYLES[model.provider].bgLight} 
                                                   ${PROVIDER_STYLES[model.provider].color}`}>
                                        {model.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}