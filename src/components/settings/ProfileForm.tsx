'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import styles from '@/styles/components/settings/form.module.css'

interface ProfileFormProps {
    user: {
        email: string
        name?: string
    }
    onUpdate: (data: { email?: string; name?: string }) => Promise<void>
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
    const { showToast } = useToast()
    const [email, setEmail] = useState(user.email)
    const [name, setName] = useState(user.name || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await onUpdate({ email, name: name || undefined })
            showToast('success', 'Profile updated successfully!')
        } catch (error: any) {
            showToast('error', error.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Profile Information</h2>
                <p className={styles.formDescription}>
                    Update your account's profile information and email address.
                </p>

                <div className={styles.formFields}>
                    <div className={styles.fieldGroup}>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            aria-label="Your name"
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            aria-label="Email address"
                            aria-required="true"
                        />
                    </div>
                </div>

                <div className={styles.formActions}>
                    <Button type="submit" disabled={loading} aria-busy={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
