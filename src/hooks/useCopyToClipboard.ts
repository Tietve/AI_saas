import { useState, useCallback } from 'react'

interface CopyStatus {
    copied: boolean
    error: Error | null
}

export function useCopyToClipboard(resetDelay: number = 2000) {
    const [status, setStatus] = useState<CopyStatus>({
        copied: false,
        error: null
    })

    const copy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setStatus({ copied: true, error: null })

            setTimeout(() => {
                setStatus({ copied: false, error: null })
            }, resetDelay)

            return true
        } catch (error) {
            setStatus({
                copied: false,
                error: error instanceof Error ? error : new Error('Copy failed')
            })
            return false
        }
    }, [resetDelay])

    return { ...status, copy }
}