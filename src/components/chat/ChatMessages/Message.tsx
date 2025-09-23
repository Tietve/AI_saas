

import { Message as MessageType, BotPersonality } from '../shared/types'
import { AVAILABLE_MODELS, PROVIDER_STYLES } from '../shared/constants'
import { formatDate } from '../shared/utils'
import { CheckCheck } from 'lucide-react'
import { AttachmentList } from '../shared/AttachmentList'

interface MessageProps {
    message: MessageType
    selectedBot?: BotPersonality
    showAvatar?: boolean
}

export function Message({ message, selectedBot, showAvatar = true }: MessageProps) {
    const isUser = message.role === 'USER'
    const model = AVAILABLE_MODELS.find(m => m.id === message.model)
    const attachments = message.attachments || []
    const hasText = Boolean(message.content && message.content.trim().length > 0)

    return (
        <div className={`message-wrapper flex ${isUser ? 'justify-end' : 'justify-start'} 
                        animate-in fade-in slide-in-from-bottom-1 duration-200`}>
            {isUser ? (
                
                <div className="max-w-[85%] lg:max-w-[70%]">
                    <div className="flex flex-col items-end gap-2">
                        {attachments.length > 0 && <AttachmentList attachments={attachments} role="USER" />}

                        {hasText && (
                            <div className="group relative message-bubble message-bubble--user">
                                <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                </p>
                            </div>
                        )}

                        <div className="message-metadata justify-end">
                            <span>
                                {formatDate(message.createdAt)}
                            </span>
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                        </div>
                    </div>
                </div>
            ) : (

                <div className="flex gap-3 max-w-[85%] lg:max-w-[70%]">
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

                    {!showAvatar && <div className="w-8 flex-shrink-0" />}

                    <div className="flex-1">
                        <div className="group relative space-y-2">
                            {attachments.length > 0 && <AttachmentList attachments={attachments} role="ASSISTANT" />}

                            {hasText && (
                                <div className="message-bubble message-bubble--assistant">
                                    <div className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                        {message.isStreaming && (
                                            <span className="inline-block w-1 h-4 ml-0.5 bg-gray-400 animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="message-metadata mt-1">
                                <span>
                                    {formatDate(message.createdAt)}
                                </span>
                                {model && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PROVIDER_STYLES[model.provider].bgLight} ${PROVIDER_STYLES[model.provider].color}`}>
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