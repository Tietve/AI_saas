import styles from "@/styles/components/chat/messages.module.css";
import {MessageBubble} from "@/components/chat-v2/MessageBubble";
import {TypingIndicator} from "@/components/chat-v2/TypingIndicator";

export function ChatMessages({
                                 messages,
                                 isLoading,
                                 messagesEndRef,
                                 selectedBot
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
                {displayMessages.map((message, index) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isLast={index === displayMessages.length - 1}
                    />
                ))}

                {isLoading && <TypingIndicator />}

                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}