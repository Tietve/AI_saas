'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import styles from '@/styles/components/settings/form.module.css'

interface PasswordChangeFormProps {
    onUpdate: (data: { currentPassword: string; newPassword: string }) => Promise<void>
}

export function PasswordChangeForm({ onUpdate }: PasswordChangeFormProps) {
    const { showToast } = useToast()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validation
        if (newPassword.length < 8) {
            showToast('error', 'Password must be at least 8 characters')
            setLoading(false)
            return
        }

        if (newPassword !== confirmPassword) {
            showToast('error', 'New passwords do not match')
            setLoading(false)
            return
        }

        try {
            await onUpdate({ currentPassword, newPassword })
            showToast('success', 'Password changed successfully!')
            // Reset form
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            showToast('error', error.message || 'Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Change Password</h2>
                <p className={styles.formDescription}>
                    Ensure your account is using a long, random password to stay secure.
                </p>

                <div className={styles.formFields}>
                    <div className={styles.fieldGroup}>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            required
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 8 characters)"
                            required
                            minLength={8}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                        />
                    </div>
                </div>

                <div className={styles.formActions}>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Changing...' : 'Change Password'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
