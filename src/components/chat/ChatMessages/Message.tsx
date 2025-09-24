

import { Message as MessageType, BotPersonality } from '../shared/types'
import { AVAILABLE_MODELS, PROVIDER_STYLES } from '../shared/constants'
import { formatDate } from '../shared/utils'
import { CheckCheck, ThumbsUp, ThumbsDown, Copy, Share2, Bookmark, Flag, MoreHorizontal, RefreshCw, Edit3, Trash2 } from 'lucide-react'
import { AttachmentList } from '../shared/AttachmentList'
import { ArtifactBlock } from './ArtifactBlock'

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
    const artifactMatch = hasText ? message.content.match(/```(\w+)?[\r\n]+([\s\S]*?)```/) : null

    return (
        <div className={`message-wrapper flex ${isUser ? 'justify-end' : 'justify-start'} 
                        animate-in fade-in slide-in-from-bottom-1 duration-200`}>
            {isUser ? (
                
                <div className="max-w-[85%] lg:max-w-[70%]">
                    <div className="flex flex-col items-end gap-2">
                        {attachments.length > 0 && <AttachmentList attachments={attachments} role="USER" />}

                        {hasText && (
                            <div className="group relative">
                                <div className="bg-blue-600 text-white rounded-2xl px-4 py-2.5 shadow-sm
                                              hover:bg-blue-700 transition-colors">
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-1 text-right">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {formatDate(message.createdAt)}
                            </span>
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                        </div>
                        
                        {/* Message Actions */}
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Thích">
                                <ThumbsUp className="w-4 h-4 text-gray-500 hover:text-blue-500" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Không thích">
                                <ThumbsDown className="w-4 h-4 text-gray-500 hover:text-red-500" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Sao chép">
                                <Copy className="w-4 h-4 text-gray-500 hover:text-green-500" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Chia sẻ">
                                <Share2 className="w-4 h-4 text-gray-500 hover:text-purple-500" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Lưu">
                                <Bookmark className="w-4 h-4 text-gray-500 hover:text-yellow-500" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Báo cáo">
                                <Flag className="w-4 h-4 text-gray-500 hover:text-orange-500" />
                            </button>
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
                        <div className="group relative space-y-2">
                            {attachments.length > 0 && <AttachmentList attachments={attachments} role="ASSISTANT" />}

                            {hasText && artifactMatch ? (
                                <ArtifactBlock language={artifactMatch[1]} content={artifactMatch[2].trimEnd()} />
                            ) : hasText ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                                    <div className="text-sm whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
                                        {message.content}
                                        {message.isStreaming && (
                                            <span className="inline-block w-1 h-4 ml-0.5 bg-gray-400 animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            ) : null}

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
                            
                            {/* AI Message Actions */}
                            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Thích">
                                    <ThumbsUp className="w-4 h-4 text-gray-500 hover:text-blue-500" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Không thích">
                                    <ThumbsDown className="w-4 h-4 text-gray-500 hover:text-red-500" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Sao chép">
                                    <Copy className="w-4 h-4 text-gray-500 hover:text-green-500" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Tạo lại">
                                    <RefreshCw className="w-4 h-4 text-gray-500 hover:text-blue-500" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Chỉnh sửa">
                                    <Edit3 className="w-4 h-4 text-gray-500 hover:text-purple-500" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Chia sẻ">
                                    <Share2 className="w-4 h-4 text-gray-500 hover:text-indigo-500" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Lưu">
                                    <Bookmark className="w-4 h-4 text-gray-500 hover:text-yellow-500" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Thêm">
                                    <MoreHorizontal className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}