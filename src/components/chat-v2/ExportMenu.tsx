import React, { useState } from 'react'
import { Download, FileText, FileJson, FileType, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from '@/styles/components/chat/export.module.css'
import {
    exportAsMarkdown,
    exportAsJSON,
    exportAsPDF,
    exportAsHTML,
    type ExportFormat
} from '@/lib/export/exportUtils'
import type { Message } from '@/components/chat/shared/types'

interface ExportMenuProps {
    messages: Message[]
    conversationTitle?: string
}

export function ExportMenu({ messages, conversationTitle = 'Conversation' }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)

    const handleExport = async (format: ExportFormat) => {
        if (messages.length === 0) {
            alert('Không có tin nhắn để xuất!')
            return
        }

        setIsExporting(true)
        setExportingFormat(format)

        try {
            const options = {
                format,
                conversationTitle,
                includeTimestamps: true,
                includeMetadata: true
            }

            switch (format) {
                case 'markdown':
                    exportAsMarkdown(messages, options)
                    break
                case 'json':
                    exportAsJSON(messages, options)
                    break
                case 'pdf':
                    await exportAsPDF(messages, options)
                    break
                case 'html':
                    exportAsHTML(messages, options)
                    break
            }

            setIsOpen(false)
        } catch (error) {
            console.error('Export error:', error)
            alert(`Lỗi khi xuất file ${format.toUpperCase()}. Vui lòng thử lại.`)
        } finally {
            setIsExporting(false)
            setExportingFormat(null)
        }
    }

    return (
        <div className={styles.exportContainer}>
            <Button
                variant="ghost"
                icon={<Download size={18} />}
                onClick={() => setIsOpen(!isOpen)}
                title="Xuất hội thoại"
                disabled={isExporting}
            />

            {isOpen && (
                <div className={styles.exportMenu}>
                    <div className={styles.exportHeader}>
                        📥 Xuất hội thoại
                        <span className={styles.exportCount}>
                            {messages.length} tin nhắn
                        </span>
                    </div>

                    <button
                        className={styles.exportOption}
                        onClick={() => handleExport('markdown')}
                        disabled={isExporting}
                    >
                        {exportingFormat === 'markdown' ? (
                            <Loader2 size={18} className={styles.spinner} />
                        ) : (
                            <FileText size={18} />
                        )}
                        <div className={styles.exportOptionContent}>
                            <span className={styles.exportOptionTitle}>Markdown</span>
                            <span className={styles.exportOptionDesc}>Định dạng text (.md)</span>
                        </div>
                    </button>

                    <button
                        className={styles.exportOption}
                        onClick={() => handleExport('json')}
                        disabled={isExporting}
                    >
                        {exportingFormat === 'json' ? (
                            <Loader2 size={18} className={styles.spinner} />
                        ) : (
                            <FileJson size={18} />
                        )}
                        <div className={styles.exportOptionContent}>
                            <span className={styles.exportOptionTitle}>JSON</span>
                            <span className={styles.exportOptionDesc}>Dữ liệu đầy đủ (.json)</span>
                        </div>
                    </button>

                    <button
                        className={styles.exportOption}
                        onClick={() => handleExport('html')}
                        disabled={isExporting}
                    >
                        {exportingFormat === 'html' ? (
                            <Loader2 size={18} className={styles.spinner} />
                        ) : (
                            <FileType size={18} />
                        )}
                        <div className={styles.exportOptionContent}>
                            <span className={styles.exportOptionTitle}>HTML</span>
                            <span className={styles.exportOptionDesc}>Trang web (.html)</span>
                        </div>
                    </button>

                    <button
                        className={styles.exportOption}
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                    >
                        {exportingFormat === 'pdf' ? (
                            <Loader2 size={18} className={styles.spinner} />
                        ) : (
                            <Download size={18} />
                        )}
                        <div className={styles.exportOptionContent}>
                            <span className={styles.exportOptionTitle}>PDF</span>
                            <span className={styles.exportOptionDesc}>Tài liệu (.pdf) - Mất vài giây</span>
                        </div>
                    </button>
                </div>
            )}
        </div>
    )
}