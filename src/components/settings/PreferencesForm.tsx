'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import styles from '@/styles/components/settings/form.module.css'

interface PreferencesFormProps {
    preferences: {
        theme?: string
        defaultModel?: string
    }
    onUpdate: (data: { theme?: string; defaultModel?: string }) => Promise<void>
}

const THEMES = [
    { value: 'claude', label: 'Claude' },
    { value: 'chatgpt', label: 'ChatGPT' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'dark', label: 'Dark' },
]

const MODELS = [
    { value: 'gpt_4o_mini', label: 'GPT-4o Mini' },
    { value: 'gpt_4o', label: 'GPT-4o' },
    { value: 'claude_3_5_sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'claude_3_5_haiku', label: 'Claude 3.5 Haiku' },
    { value: 'gemini_1_5_pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini_1_5_flash', label: 'Gemini 1.5 Flash' },
]

export function PreferencesForm({ preferences, onUpdate }: PreferencesFormProps) {
    const { showToast } = useToast()
    const [theme, setTheme] = useState(preferences.theme || 'claude')
    const [defaultModel, setDefaultModel] = useState(preferences.defaultModel || 'gpt_4o_mini')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await onUpdate({ theme, defaultModel })
            showToast('success', 'Preferences saved successfully!')
        } catch (error: any) {
            showToast('error', error.message || 'Failed to save preferences')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Preferences</h2>
                <p className={styles.formDescription}>
                    Customize your chat experience with your preferred theme and default AI model.
                </p>

                <div className={styles.formFields}>
                    <div className={styles.fieldGroup}>
                        <Label htmlFor="theme">Theme</Label>
                        <select
                            id="theme"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className={styles.select}
                        >
                            {THEMES.map(t => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.fieldGroup}>
                        <Label htmlFor="defaultModel">Default Model</Label>
                        <select
                            id="defaultModel"
                            value={defaultModel}
                            onChange={(e) => setDefaultModel(e.target.value)}
                            className={styles.select}
                        >
                            {MODELS.map(m => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.formActions}>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
