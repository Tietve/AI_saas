/**
 * Batch Export Menu Component
 * Allows exporting multiple conversations at once
 */

import React, { useState } from 'react'
import { Download, FileText, FileJson, FileType, CheckSquare, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from '@/styles/components/chat/batch-export.module.css'
import { batchExport, type ExportFormat } from '@/lib/export/exportUtils'
import type { Message, Conversation } from '@/components/chat/shared/types'

interface BatchExportMenuProps {
    conversations: Conversation[]
    getConversationMessages: (conversationId: string) => Promise<Message[]>
}

export function BatchExportMenu({ conversations, getConversationMessages }: BatchExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isExporting, setIsExporting] = useState(false)
    const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const selectAll = () => {
        if (selectedIds.size === conversations.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(conversations.map(c => c.id)))
        }
    }

    const handleBatchExport = async (format: ExportFormat) => {
        if (selectedIds.size === 0) {
            alert('Vui lòng chọn ít nhất một hội thoại để xuất!')
            return
        }

        setIsExporting(true)
        setExportingFormat(format)

        try {
            // Fetch messages for all selected conversations
            const conversationsWithMessages = await Promise.all(
                Array.from(selectedIds).map(async (id) => {
                    const conv = conversations.find(c => c.id === id)
                    if (!conv) throw new Error(`Conversation ${id} not found`)

                    const messages = await getConversationMessages(id)
                    return {
                        id: conv.id,
                        title: conv.title || 'Untitled',
                        messages
                    }
                })
            )

            // Filter out empty conversations
            const validConversations = conversationsWithMessages.filter(
                conv => conv.messages.length > 0
            )

            if (validConversations.length === 0) {
                alert('Các hội thoại đã chọn không có tin nhắn!')
                return
            }

            // Perform batch export
            await batchExport({
                format,
                conversations: validConversations,
                includeTimestamps: true,
                includeMetadata: true
            })

            // Reset selection after successful export
            setSelectedIds(new Set())
            setIsOpen(false)

        } catch (error) {
            console.error('Batch export error:', error)
            alert(`Lỗi khi xuất hàng loạt ${format.toUpperCase()}. Vui lòng thử lại.`)
        } finally {
            setIsExporting(false)
            setExportingFormat(null)
        }
    }

    return (
        <div className={styles.batchExportContainer}>
            <Button
                variant="secondary"
                icon={<Download size={18} />}
                onClick={() => setIsOpen(!isOpen)}
                title="Xuất hàng loạt"
                disabled={isExporting || conversations.length === 0}
            >
                Xuất hàng loạt
            </Button>

            {isOpen && (
                <div className={styles.batchExportModal}>
                    <div className={styles.modalOverlay} onClick={() => setIsOpen(false)} />
                    <div className={styles.modalContent}>
                        {/* Header */}
                        <div className={styles.modalHeader}>
                            <h2>📦 Xuất hàng loạt</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setIsOpen(false)}
                                disabled={isExporting}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Conversation List */}
                        <div className={styles.conversationList}>
                            <div className={styles.listHeader}>
                                <button
                                    className={styles.selectAllButton}
                                    onClick={selectAll}
                                    disabled={isExporting}
                                >
                                    {selectedIds.size === conversations.length ? (
                                        <CheckSquare size={18} />
                                    ) : (
                                        <Square size={18} />
                                    )}
                                    <span>
                                        {selectedIds.size === conversations.length
                                            ? 'Bỏ chọn tất cả'
                                            : 'Chọn tất cả'
                                        }
                                    </span>
                                </button>
                                <span className={styles.selectionCount}>
                                    {selectedIds.size} / {conversations.length} đã chọn
                                </span>
                            </div>

                            <div className={styles.conversationItems}>
                                {conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        className={`${styles.conversationItem} ${
                                            selectedIds.has(conv.id) ? styles.selected : ''
                                        }`}
                                        onClick={() => toggleSelection(conv.id)}
                                        disabled={isExporting}
                                    >
                                        {selectedIds.has(conv.id) ? (
                                            <CheckSquare size={18} className={styles.checkbox} />
                                        ) : (
                                            <Square size={18} className={styles.checkbox} />
                                        )}
                                        <div className={styles.conversationInfo}>
                                            <span className={styles.conversationTitle}>
                                                {conv.title || 'Untitled'}
                                            </span>
                                            <span className={styles.conversationDate}>
                                                {new Date(conv.updatedAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Export Options */}
                        <div className={styles.exportOptions}>
                            <div className={styles.exportOptionsHeader}>
                                Chọn định dạng xuất:
                            </div>

                            <div className={styles.exportButtons}>
                                <button
                                    className={styles.exportButton}
                                    onClick={() => handleBatchExport('markdown')}
                                    disabled={isExporting || selectedIds.size === 0}
                                >
                                    {exportingFormat === 'markdown' ? (
                                        <Loader2 size={20} className={styles.spinner} />
                                    ) : (
                                        <FileText size={20} />
                                    )}
                                    <div>
                                        <div className={styles.exportButtonTitle}>Markdown</div>
                                        <div className={styles.exportButtonDesc}>
                                            Kết hợp tất cả vào 1 file .md
                                        </div>
                                    </div>
                                </button>

                                <button
                                    className={styles.exportButton}
                                    onClick={() => handleBatchExport('json')}
                                    disabled={isExporting || selectedIds.size === 0}
                                >
                                    {exportingFormat === 'json' ? (
                                        <Loader2 size={20} className={styles.spinner} />
                                    ) : (
                                        <FileJson size={20} />
                                    )}
                                    <div>
                                        <div className={styles.exportButtonTitle}>JSON</div>
                                        <div className={styles.exportButtonDesc}>
                                            Kết hợp tất cả vào 1 file .json
                                        </div>
                                    </div>
                                </button>

                                <button
                                    className={styles.exportButton}
                                    onClick={() => handleBatchExport('html')}
                                    disabled={isExporting || selectedIds.size === 0}
                                >
                                    {exportingFormat === 'html' ? (
                                        <Loader2 size={20} className={styles.spinner} />
                                    ) : (
                                        <FileType size={20} />
                                    )}
                                    <div>
                                        <div className={styles.exportButtonTitle}>HTML</div>
                                        <div className={styles.exportButtonDesc}>
                                            Mỗi hội thoại 1 file .html riêng
                                        </div>
                                    </div>
                                </button>

                                <button
                                    className={styles.exportButton}
                                    onClick={() => handleBatchExport('pdf')}
                                    disabled={isExporting || selectedIds.size === 0}
                                >
                                    {exportingFormat === 'pdf' ? (
                                        <Loader2 size={20} className={styles.spinner} />
                                    ) : (
                                        <Download size={20} />
                                    )}
                                    <div>
                                        <div className={styles.exportButtonTitle}>PDF</div>
                                        <div className={styles.exportButtonDesc}>
                                            Mỗi hội thoại 1 file .pdf riêng (chậm)
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {isExporting && (
                            <div className={styles.exportingStatus}>
                                <Loader2 size={24} className={styles.spinner} />
                                <span>Đang xuất {exportingFormat?.toUpperCase()}...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
