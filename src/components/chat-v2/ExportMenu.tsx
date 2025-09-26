import React, { useState } from 'react'
import { Download, FileText, FileJson, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from '@/styles/components/chat/export.module.css'

interface ExportMenuProps {
    messages: any[]
    conversationTitle?: string
}

export function ExportMenu({ messages, conversationTitle = 'Conversation' }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false)

    const exportAsMarkdown = () => {
        const markdown = messages.map(msg => {
            const role = msg.role === 'USER' ? '**You**' : '**Assistant**'
            return `${role}: ${msg.content}\n\n`
        }).join('---\n\n')

        const blob = new Blob([markdown], { type: 'text/markdown' })
        downloadFile(blob, `${conversationTitle}.md`)
    }

    const exportAsJSON = () => {
        const data = {
            title: conversationTitle,
            exportDate: new Date().toISOString(),
            messages: messages
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        downloadFile(blob, `${conversationTitle}.json`)
    }

    const exportAsPDF = async () => {
        // Cần thêm library như jsPDF
        alert('PDF export coming soon!')
    }

    const downloadFile = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setIsOpen(false)
    }

    return (
        <div className={styles.exportContainer}>
            <Button
                variant="ghost"
                icon={<Download size={18} />}
                onClick={() => setIsOpen(!isOpen)}
                title="Export conversation"
            />

            {isOpen && (
                <div className={styles.exportMenu}>
                    <div className={styles.exportHeader}>Export Conversation</div>

                    <button className={styles.exportOption} onClick={exportAsMarkdown}>
                        <FileText size={18} />
                        <span>Markdown (.md)</span>
                    </button>

                    <button className={styles.exportOption} onClick={exportAsJSON}>
                        <FileJson size={18} />
                        <span>JSON (.json)</span>
                    </button>

                    <button className={styles.exportOption} onClick={exportAsPDF}>
                        <ImageIcon size={18} />
                        <span>PDF (Coming soon)</span>
                    </button>
                </div>
            )}
        </div>
    )
}