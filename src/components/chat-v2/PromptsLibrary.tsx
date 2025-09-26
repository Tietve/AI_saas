import React, { useState } from 'react'
import { BookOpen, Plus, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from '@/styles/components/chat/prompts.module.css'

interface Prompt {
    id: string
    title: string
    content: string
    category: string
    tags: string[]
}

export function PromptsLibrary({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [prompts, setPrompts] = useState<Prompt[]>([
        {
            id: '1',
            title: 'Code Review',
            content: 'Review this code for best practices, potential bugs, and optimization opportunities:',
            category: 'Development',
            tags: ['code', 'review']
        },
        {
            id: '2',
            title: 'Explain Like I\'m 5',
            content: 'Explain this concept in simple terms that a 5-year-old could understand:',
            category: 'Education',
            tags: ['explain', 'simple']
        },
        {
            id: '3',
            title: 'Summarize',
            content: 'Provide a concise summary of the following text, highlighting key points:',
            category: 'Writing',
            tags: ['summary', 'brief']
        }
    ])

    const [selectedCategory, setSelectedCategory] = useState('All')
    const categories = ['All', 'Development', 'Education', 'Writing', 'Creative', 'Business']

    const filteredPrompts = selectedCategory === 'All'
        ? prompts
        : prompts.filter(p => p.category === selectedCategory)

    return (
        <div className={styles.promptsContainer}>
            <Button
                variant="ghost"
                icon={<BookOpen size={18} />}
                onClick={() => setIsOpen(!isOpen)}
                title="Prompts Library"
            />

            {isOpen && (
                <div className={styles.promptsModal}>
                    <div className={styles.promptsHeader}>
                        <h3>Prompts Library</h3>
                        <Button
                            variant="ghost"
                            icon={<Plus size={18} />}
                            onClick={() => alert('Add prompt feature coming soon!')}
                        />
                    </div>

                    <div className={styles.categories}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`${styles.categoryTab} ${selectedCategory === cat ? styles.active : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className={styles.promptsList}>
                        {filteredPrompts.map(prompt => (
                            <div key={prompt.id} className={styles.promptCard}>
                                <div className={styles.promptTitle}>{prompt.title}</div>
                                <div className={styles.promptContent}>{prompt.content}</div>
                                <div className={styles.promptTags}>
                                    {prompt.tags.map(tag => (
                                        <span key={tag} className={styles.tag}>#{tag}</span>
                                    ))}
                                </div>
                                <div className={styles.promptActions}>
                                    <button
                                        className={styles.useButton}
                                        onClick={() => {
                                            onSelectPrompt(prompt.content)
                                            setIsOpen(false)
                                        }}
                                    >
                                        Use
                                    </button>
                                    <Button variant="ghost" icon={<Edit size={14} />} />
                                    <Button variant="ghost" icon={<Trash2 size={14} />} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}