import React from 'react'
import { Sparkles, Zap, Code, Lightbulb } from 'lucide-react'
import styles from '@/styles/components/chat/welcome.module.css'

interface WelcomeScreenProps {
    onSuggestionClick: (text: string) => void
}

const suggestions = [
    {
        icon: <Sparkles size={18} />,
        title: "Explain quantum computing",
        text: "Explain quantum computing in simple terms"
    },
    {
        icon: <Code size={18} />,
        title: "Write Python code",
        text: "Write a Python function to find prime numbers"
    },
    {
        icon: <Lightbulb size={18} />,
        title: "Creative writing",
        text: "Write a short story about time travel"
    },
    {
        icon: <Zap size={18} />,
        title: "Summarize article",
        text: "Summarize the key points of [paste article]"
    }
]

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.welcomeContent}>
                <h1 className={styles.welcomeTitle}>
                    How can I help you today?
                </h1>

                <div className={styles.suggestionsGrid}>
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            className={styles.suggestionCard}
                            onClick={() => onSuggestionClick(suggestion.text)}
                        >
                            <div className={styles.suggestionIcon}>
                                {suggestion.icon}
                            </div>
                            <span className={styles.suggestionTitle}>
                {suggestion.title}
              </span>
                        </button>
                    ))}
                </div>

                <div className={styles.capabilities}>
                    <div className={styles.capability}>
                        <span className={styles.capabilityDot} />
                        <span>Remember context</span>
                    </div>
                    <div className={styles.capability}>
                        <span className={styles.capabilityDot} />
                        <span>Analyze images</span>
                    </div>
                    <div className={styles.capability}>
                        <span className={styles.capabilityDot} />
                        <span>Generate code</span>
                    </div>
                </div>
            </div>
        </div>
    )
}