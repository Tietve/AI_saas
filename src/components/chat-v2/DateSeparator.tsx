import React from 'react'
import styles from '@/styles/components/chat/messages.module.css'

interface DateSeparatorProps {
    date: string
}

export function DateSeparator({ date }: DateSeparatorProps) {
    const formatDate = (dateString: string) => {
        const d = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (d.toDateString() === today.toDateString()) {
            return 'Hôm nay'
        }
        if (d.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua'
        }

        const day = d.getDate().toString().padStart(2, '0')
        const month = (d.getMonth() + 1).toString().padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
    }

    return (
        <div className={styles.dateSeparator}>
            <span className={styles.dateSeparatorText}>
                {formatDate(date)}
            </span>
        </div>
    )
}