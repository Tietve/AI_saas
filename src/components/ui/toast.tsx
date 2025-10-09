'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import styles from '@/styles/components/ui/toast.module.css'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastContextType {
    toasts: Toast[]
    showToast: (type: ToastType, message: string, duration?: number) => void
    hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((type: ToastType, message: string, duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts((prev) => [...prev, { id, type, message, duration }])

        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                hideToast(id)
            }, duration)
        }
    }, [])

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
            {children}
            <ToastContainer toasts={toasts} onClose={hideToast} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
    if (toasts.length === 0) return null

    return (
        <div className={styles.toastContainer}>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
    const icons = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        warning: <AlertCircle size={20} />,
        info: <AlertCircle size={20} />,
    }

    return (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
            <div className={styles.toastIcon}>
                {icons[toast.type]}
            </div>
            <div className={styles.toastMessage}>{toast.message}</div>
            <button
                onClick={() => onClose(toast.id)}
                className={styles.toastClose}
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
        </div>
    )
}
