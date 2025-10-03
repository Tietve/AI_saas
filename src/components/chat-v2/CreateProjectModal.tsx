import { useState } from 'react'
import { X } from 'lucide-react'
import styles from '@/styles/components/chat/modal.module.css'

interface CreateProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (name: string, description?: string, color?: string) => Promise<void>
}

const COLORS = [
    { value: '#3b82f6', name: 'Blue' },
    { value: '#10b981', name: 'Green' },
    { value: '#f59e0b', name: 'Yellow' },
    { value: '#ef4444', name: 'Red' },
    { value: '#8b5cf6', name: 'Purple' },
    { value: '#ec4899', name: 'Pink' },
    { value: '#06b6d4', name: 'Cyan' },
    { value: '#f97316', name: 'Orange' },
]

export function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState(COLORS[0].value)
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            await onCreate(name.trim(), description.trim() || undefined, color)
            setName('')
            setDescription('')
            setColor(COLORS[0].value)
            onClose()
        } catch (error) {
            console.error('Create project error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Create Project</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label>Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Web Development"
                            required
                            autoFocus
                            maxLength={100}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What is this project about?"
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Color</label>
                        <div className={styles.colorPicker}>
                            {COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    className={`${styles.colorOption} ${color === c.value ? styles.selected : ''}`}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => setColor(c.value)}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" disabled={!name.trim() || loading}>
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
