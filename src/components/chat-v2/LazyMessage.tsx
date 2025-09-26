import React, { memo } from 'react'
import { useIntersectionObserver } from '@/hooks/usePerformance'
import { MessageBubble } from './MessageBubble'
import styles from '@/styles/components/chat/message.module.css'

interface LazyMessageProps {
    message: {
        id: string
        role: 'USER' | 'ASSISTANT'
        content: string
        createdAt: string
    }
    isLast: boolean
}

export const LazyMessage = memo(({ message, isLast }: LazyMessageProps) => {
    const { targetRef, isIntersecting } = useIntersectionObserver({
        rootMargin: '100px',
        threshold: 0.1
    })

    return (
        <div ref={targetRef as any} className={styles.lazyWrapper}>
            {isIntersecting ? (
                <MessageBubble message={message} isLast={isLast} />
            ) : (
                <div className={styles.messagePlaceholder}>
                    <div className={styles.skeleton} />
                </div>
            )}
        </div>
    )
}, (prevProps, nextProps) => {
    return prevProps.message.id === nextProps.message.id &&
        prevProps.isLast === nextProps.isLast
})

LazyMessage.displayName = 'LazyMessage'