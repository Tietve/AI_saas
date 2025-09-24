import React from 'react'

interface DateSeparatorProps {
    label: string
}

export function DateSeparator({ label }: DateSeparatorProps) {
    return (
        <div className="relative my-4 flex items-center justify-center" role="separator" aria-label={label}>
            <div className="message-separator-line" />
            <span className="message-separator-label">
                {label}
            </span>
        </div>
    )
}



