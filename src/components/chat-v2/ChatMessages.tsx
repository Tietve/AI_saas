import React from 'react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { Message } from '@/components/chat/shared/types'
import styles from '@/styles/components/chat/messages.module.css'

interface ChatMessagesProps {
    messages: Message[]
    isLoading: boolean
    messagesEndRef: React.RefObject<HTMLDivElement>
    selectedBot?: any
}

export function ChatMessages({
                                 messages,
                                 isLoading,
                                 messagesEndRef,
                                 selectedBot
                             }: ChatMessagesProps) {
    return (
        <div className={styles.messagesContainer}>
            <div className={styles.messagesInner}>
                {messages.map((message, index) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isLast={index === messages.length - 1}
                    />
                ))}

                {isLoading && <TypingIndicator />}

                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}