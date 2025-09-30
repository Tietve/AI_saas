import React from 'react'
import { User, Bot, Sparkles } from 'lucide-react'
import styles from '@/styles/components/chat/avatar.module.css'

interface AvatarProps {
    type: 'user' | 'assistant'
    name?: string
    botId?: string
    size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ type, name, botId, size = 'md' }: AvatarProps) {
    const getInitial = () => {
        if (name) return name.charAt(0).toUpperCase()
        return type === 'user' ? 'U' : 'AI'
    }

    const getBotIcon = () => {
        // Different icons for different bot personalities
        switch(botId) {
            case 'luna': return <Sparkles size={16} />
            case 'sage': return <Bot size={16} />
            default: return <Bot size={16} />
        }
    }

    return (
        <div className={`${styles.avatar} ${styles[size]} ${styles[type]}`}>
            {type === 'user' ? (
                <>
                    <span className={styles.initial}>{getInitial()}</span>
                    <User size={14} className={styles.icon} />
                </>
            ) : (
                <>
                    <span className={styles.botIcon}>{getBotIcon()}</span>
                </>
            )}
        </div>
    )
}