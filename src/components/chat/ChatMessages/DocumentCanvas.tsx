import React from 'react'
import { Copy, Edit3, Download, MoreHorizontal, MessageSquare, Plus, Trash2 } from 'lucide-react'

interface DocumentCanvasProps {
    title: string
    content: string
    sections?: Array<{
        id: string
        title: string
        content: string
        type: 'text' | 'code' | 'list'
    }>
}

export function DocumentCanvas({ title, content, sections = [] }: DocumentCanvasProps) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content)
        } catch {
            /* noop */
        }
    }

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title}.txt`
        document.body.appendChild(a)
        a.click()
        // Safely remove the element if it still exists in the DOM
        if (a.parentNode) {
            document.body.removeChild(a)
        }
        URL.revokeObjectURL(url)
    }

    return (
        <div className="document-canvas">
            <div className="document-canvas-header">
                <div className="document-canvas-title">
                    {title}
                </div>
                <div className="document-canvas-actions">
                    <button className="document-canvas-action" onClick={handleCopy} title="Sao chép">
                        <Copy className="w-4 h-4" />
                    </button>
                    <button className="document-canvas-action" title="Chỉnh sửa">
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="document-canvas-action" onClick={handleDownload} title="Tải xuống">
                        <Download className="w-4 h-4" />
                    </button>
                    <button className="document-canvas-action" title="Thêm">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <div className="document-canvas-content">
                {sections.length > 0 ? (
                    <div className="space-y-4">
                        {sections.map((section) => (
                            <div key={section.id} className="document-section">
                                <h3 className="document-section-title">{section.title}</h3>
                                <div className="document-section-content">
                                    {section.type === 'list' ? (
                                        <ul className="document-list">
                                            {section.content.split('\n').map((item, index) => (
                                                <li key={index} className="document-list-item">
                                                    {item.replace(/^[-*]\s*/, '')}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : section.type === 'code' ? (
                                        <pre className="document-code">
                                            <code>{section.content}</code>
                                        </pre>
                                    ) : (
                                        <p className="document-text">{section.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="document-text">{content}</div>
                )}
            </div>
            
            <div className="document-canvas-footer">
                <div className="document-canvas-comment">
                    <button className="document-comment-button">
                        <MessageSquare className="w-4 h-4" />
                        <span>Thêm bình luận</span>
                    </button>
                </div>
                <div className="document-canvas-edit">
                    <button className="document-edit-button">
                        <Plus className="w-4 h-4" />
                        <span>Thêm phần mới</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

