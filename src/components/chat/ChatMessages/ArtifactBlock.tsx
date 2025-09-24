import React from 'react'
import { Copy, Download } from 'lucide-react'

interface ArtifactBlockProps {
    title?: string
    language?: string
    content: string
}

export function ArtifactBlock({ title, language, content }: ArtifactBlockProps) {
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
        a.download = `${title || language || 'artifact'}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="artifact-card">
            <div className="artifact-header">
                <div className="artifact-title">
                    {title || language || 'Artifact'}
                </div>
                <div className="artifact-actions">
                    <button className="artifact-action" onClick={handleCopy} title="Sao chép">
                        <Copy className="w-4 h-4" />
                    </button>
                    <button className="artifact-action" onClick={handleDownload} title="Tải xuống">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <pre className="artifact-content" aria-label="artifact content"><code>{content}</code></pre>
        </div>
    )
}



