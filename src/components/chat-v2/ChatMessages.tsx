import styles from "@/styles/components/chat/messages.module.css";
import {MessageBubble} from "@/components/chat-v2/MessageBubble";
import {TypingIndicator} from "@/components/chat-v2/TypingIndicator";

interface ChatMessagesProps {
    messages: any[]
    isLoading: boolean
    messagesEndRef: React.RefObject<HTMLDivElement>
    selectedBot?: any
    onRegenerate?: () => void
}

export function ChatMessages({
                                 messages,
                                 isLoading,
                                 messagesEndRef,
                                 selectedBot,
                                 onRegenerate
                             }: ChatMessagesProps) {
    // Filter out empty assistant messages that are just placeholders
    const displayMessages = messages.filter(msg => {
        // Skip empty assistant messages that are streaming
        if (msg.role === 'ASSISTANT' && msg.content === '' && msg.isStreaming) {
            return false
        }
        return true
    })

    return (
        <div className={styles.messagesContainer}>
            <div className={styles.messagesInner}>
                {displayMessages.map((message, index) => {
                    const isLast = index === displayMessages.length - 1
                    return (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isLast={isLast}
                            onRegenerate={isLast && message.role === 'ASSISTANT' ? onRegenerate : undefined}
                        />
                    )
                })}

                {isLoading && <TypingIndicator />}

                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}