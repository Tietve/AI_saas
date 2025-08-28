// 📁 File: src/lib/rateLimit.ts (rate limit đơn giản theo user – in-memory)
// ⚠️ Dùng tạm cho dev. Prod/serverless cần Redis hoặc KV shared.
// ============================================================================
const buckets = new Map<string, { tokens: number; resetAt: number }>();


export function consumeToken(key: string, limitPerMin = 60) {
    const now = Date.now();
    const minute = 60_000;
    const slotStart = Math.floor(now / minute) * minute;
    const b = buckets.get(key) || { tokens: 0, resetAt: slotStart + minute };
    if (b.resetAt <= now) {
        b.tokens = 0;
        b.resetAt = slotStart + minute;
    }
    if (b.tokens >= limitPerMin) return { ok: false, resetAt: b.resetAt };
    b.tokens += 1;
    buckets.set(key, b);
    return { ok: true, resetAt: b.resetAt };
}