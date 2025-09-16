// src/lib/rate-limit/types.ts
export type RateLimitOptions = {
    /** Số request tối đa trong mỗi window (với fixed-window) hoặc tốc độ refill (token/min) với token-bucket */
    limit: number
    /** Kích thước cửa sổ (ms) cho fixed-window; với token-bucket dùng để suy ra rate */
    windowMs: number
    /** Sức chứa (burst) tối đa cho token-bucket. Mặc định = limit. */
    burst?: number
}

export type RateLimitResult = {
    ok: boolean
    /** Tổng limit của window/bucket hiện tại */
    limit: number
    /** Còn lại bao nhiêu “lượt” (xấp xỉ với token-bucket) */
    remaining: number
    /** Unix ms khi reset (window kết thúc hoặc token kế tiếp sẵn sàng) */
    resetAt: number
    /** Bao lâu nữa (ms) client nên thử lại; 0 nếu ok */
    retryAfterMs: number
}

export interface RateLimiter {
    consume(key: string, opts?: Partial<RateLimitOptions>): Promise<RateLimitResult>
}

export type KeyInput = { userId?: string | null; ip?: string | null; route?: string }
export type KeyFn = (i: KeyInput) => string

export function toHeaders(res: RateLimitResult): Record<string, string> {
    const retrySec = Math.max(0, Math.ceil(res.retryAfterMs / 1000))
    return {
        'X-RateLimit-Limit': String(res.limit),
        'X-RateLimit-Remaining': String(Math.max(0, res.remaining)),
        'X-RateLimit-Reset': String(Math.floor(res.resetAt / 1000)),
        ...(retrySec > 0 ? { 'Retry-After': String(retrySec) } : {})
    }
}
