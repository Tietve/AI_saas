import React, { useState } from 'react'
import { Copy, Check, Terminal, FileCode } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-css'
import styles from '@/styles/components/chat/codeblock.module.css'

interface CodeBlockProps {
    code: string
    language: string
    filename?: string
}

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const highlighted = Prism.highlight(
        code,
        Prism.languages[language] || Prism.languages.plaintext,
        language
    )

    return (
        <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
                <div className={styles.codeInfo}>
                    <FileCode size={14} />
                    <span className={styles.language}>{language}</span>
                    {filename && <span className={styles.filename}>{filename}</span>}
                </div>
                <button onClick={handleCopy} className={styles.copyButton}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className={styles.codeContent}>
        <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
        </div>
    )
}