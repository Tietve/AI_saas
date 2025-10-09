'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { PasswordChangeForm } from '@/components/settings/PasswordChangeForm'
import { PreferencesForm } from '@/components/settings/PreferencesForm'
import { ArrowLeft } from 'lucide-react'
import styles from '@/styles/pages/settings.module.css'

export default function SettingsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadUserData()
    }, [])

    async function loadUserData() {
        try {
            const res = await fetch('/api/me', {
                credentials: 'include',
                cache: 'no-store'
            })

            if (!res.ok) {
                router.push('/auth/signin')
                return
            }

            const data = await res.json()
            if (data.authenticated) {
                setUser(data.user)
            } else {
                router.push('/auth/signin')
            }
        } catch (error) {
            console.error('Failed to load user data:', error)
            router.push('/auth/signin')
        } finally {
            setLoading(false)
        }
    }

    async function handleProfileUpdate(data: { email?: string; name?: string }) {
        const res = await fetch('/api/user/update', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'profile', ...data })
        })

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message || 'Failed to update profile')
        }

        // Reload user data
        await loadUserData()
    }

    async function handlePasswordUpdate(data: { currentPassword: string; newPassword: string }) {
        const res = await fetch('/api/user/update', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'password', ...data })
        })

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message || 'Failed to change password')
        }
    }

    async function handlePreferencesUpdate(data: { theme?: string; defaultModel?: string }) {
        const res = await fetch('/api/user/update', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'preferences', ...data })
        })

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message || 'Failed to save preferences')
        }

        // Reload user data
        await loadUserData()
    }

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Loading settings...</p>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className={styles.settingsContainer}>
            <div className={styles.settingsHeader}>
                <button onClick={() => router.push('/chat')} className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Back to Chat
                </button>
                <h1 className={styles.pageTitle}>Settings</h1>
                <p className={styles.pageDescription}>
                    Manage your account settings and preferences
                </p>
            </div>

            <div className={styles.settingsContent}>
                <ProfileForm
                    user={{
                        email: user.email,
                        name: user.name
                    }}
                    onUpdate={handleProfileUpdate}
                />

                <PasswordChangeForm onUpdate={handlePasswordUpdate} />

                <PreferencesForm
                    preferences={{
                        theme: user.settings?.theme,
                        defaultModel: user.settings?.defaultModel
                    }}
                    onUpdate={handlePreferencesUpdate}
                />
            </div>
        </div>
    )
}
