// lib/tokenizer/estimate.ts
export function estimateTokensFromText(text: string): number {
    // xấp xỉ: 1 token ≈ 4 ký tự tiếng Anh; tiếng Việt có thể ~3–4
    const chars = text?.length ?? 0
    return Math.max(1, Math.ceil(chars / 4))
}

export function estimateTokensFromMessages(msgs: { role: string; content: string }[]) {
    return msgs.reduce((sum, m) => sum + estimateTokensFromText(m.content), 0)
}
