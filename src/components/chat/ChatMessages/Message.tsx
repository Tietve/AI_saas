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

    if (isUser) {
        return (
            <div className="message-wrapper justify-end">
                <div className="max-w-[85%] lg:max-w-[70%] flex flex-col items-end gap-2">
                    {attachments.length > 0 && <AttachmentList attachments={attachments} role="USER" />}

                    {hasText && (
                        <div className="message-bubble message-bubble--user">
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {message.content}
                            </p>
                        </div>
                    )}

                    <div className="message-meta text-right">
                        <span>{formatDate(message.createdAt)}</span>
                        <CheckCheck className="w-3.5 h-3.5" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="message-wrapper">
            {showAvatar ? (
                <div className="message-avatar message-avatar--bot">
                    {selectedBot ? selectedBot.appearance.emoji : 'AI'}
                </div>
            ) : (
                <div className="w-10" />
            )}

            <div className="flex-1 min-w-0 space-y-2">
                {attachments.length > 0 && <AttachmentList attachments={attachments} role="ASSISTANT" />}

                {hasText && (
                    <div className="message-bubble message-bubble--assistant">
                        <div className="text-sm leading-7 whitespace-pre-wrap break-words">
                            {message.content}
                            {message.isStreaming && <span className="streaming-cursor" />}
                        </div>
                    </div>
                )}

                <div className="message-meta">
                    <span>{formatDate(message.createdAt)}</span>
                    {model && (
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                            PROVIDER_STYLES[model.provider].bgLight
                        } ${PROVIDER_STYLES[model.provider].color}`}>
                            {model.name}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
