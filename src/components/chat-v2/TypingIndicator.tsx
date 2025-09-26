import React from 'react'
import styles from '@/styles/components/chat/typing.module.css'

export function TypingIndicator() {
    return (
        <div className={styles.typingWrapper}>
            <div className={styles.typingBubble}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
            </div>
        </div>
    )
}