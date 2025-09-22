
export function estimateTokensFromText(text: string): number {
    
    const chars = text?.length ?? 0
    return Math.max(1, Math.ceil(chars / 4))
}

export function estimateTokensFromMessages(msgs: { role: string; content: string }[]) {
    return msgs.reduce((sum, m) => sum + estimateTokensFromText(m.content), 0)
}
