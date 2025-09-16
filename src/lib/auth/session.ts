// src/lib/auth/session.ts
// Hệ thống authentication và session management thống nhất
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify, JWTPayload } from 'jose'

// Constants
const ALG = 'HS256'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'
const MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 ngày

// Helper để lấy secret key một cách an toàn
function getSecretKey(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret || secret.length < 32) {
        throw new Error('AUTH_SECRET must be at least 32 characters long')
    }
    return new TextEncoder().encode(secret)
}

// Type definitions cho session payload
export interface SessionPayload extends JWTPayload {
    uid: string // user id
    email?: string // optional email
    role?: string // optional role
}

/**
 * Tạo JWT token từ payload
 * @param payload - Thông tin user cần lưu trong session
 * @returns JWT token string
 */
export async function signSession(payload: SessionPayload): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime(`${MAX_AGE_SEC}s`)
        .sign(getSecretKey())
}

/**
 * Verify và decode JWT token
 * @param token - JWT token string
 * @returns Decoded payload hoặc throw error nếu invalid
 */
export async function verifySession(token: string): Promise<SessionPayload> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: [ALG]
        })
        return payload as SessionPayload
    } catch (error) {
        console.error('[verifySession] Invalid token:', error)
        throw new Error('Invalid session token')
    }
}

/**
 * Tạo session cookie với các security options phù hợp
 * @param userId - ID của user
 * @param additionalData - Dữ liệu bổ sung cho session (email, role, etc.)
 * @returns Object chứa cookie name, value và options
 */
export async function createSessionCookie(
    userId: string,
    additionalData?: Partial<SessionPayload>
) {
    const token = await signSession({
        uid: userId,
        ...additionalData
    })

    return {
        name: COOKIE_NAME,
        value: token,
        options: {
            httpOnly: true, // Không cho JS client access
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'lax' as const, // CSRF protection
            path: '/',
            maxAge: MAX_AGE_SEC,
        }
    }
}

/**
 * Clear session cookie (dùng cho logout)
 * @returns Object chứa cookie options để clear
 */
export async function clearSessionCookie() {
    return {
        name: COOKIE_NAME,
        value: '',
        options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 0 // Set to 0 để browser xóa cookie
        }
    }
}

/**
 * Lấy user ID từ session cookie hiện tại
 * @returns User ID hoặc null nếu không có session
 */
export async function getUserIdFromSession(): Promise<string | null> {
    try {
        // Next.js 15 yêu cầu await cookies()
        const cookieStore = await cookies()
        const token = cookieStore.get(COOKIE_NAME)?.value

        if (!token) {
            return null
        }

        const payload = await verifySession(token)

        // Kiểm tra nhiều field có thể chứa user ID
        const userId = payload.uid || payload.sub || (payload as any).userId

        return typeof userId === 'string' ? userId : null
    } catch (error) {
        console.error('[getUserIdFromSession] Error:', error)
        return null
    }
}

/**
 * Get full session data (không chỉ user ID)
 * @returns Session payload hoặc null
 */
export async function getSession(): Promise<SessionPayload | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(COOKIE_NAME)?.value

        if (!token) {
            return null
        }

        return await verifySession(token)
    } catch (error) {
        return null
    }
}

/**
 * Require authenticated user - throw error nếu không có session
 * Dùng trong API routes yêu cầu authentication
 * @returns User ID
 * @throws Error với message 'UNAUTHENTICATED' nếu không có session
 */
export async function requireUserId(): Promise<string> {
    const userId = await getUserIdFromSession()

    if (!userId) {
        throw new Error('UNAUTHENTICATED')
    }

    return userId
}

/**
 * Require authenticated session với full data
 * @returns Full session payload
 * @throws Error nếu không có session
 */
export async function requireSession(): Promise<SessionPayload> {
    const session = await getSession()

    if (!session) {
        throw new Error('UNAUTHENTICATED')
    }

    return session
}

/**
 * Refresh session token (extend expiry time)
 * Useful cho các actions quan trọng để đảm bảo session không hết hạn
 * @param currentToken - Token hiện tại
 * @returns New token với expiry time mới
 */
export async function refreshSession(currentToken: string): Promise<string> {
    const payload = await verifySession(currentToken)

    // Tạo token mới với cùng payload nhưng thời gian mới
    return await signSession({
        ...payload,
        iat: undefined, // Clear issued at để jose tự set
        exp: undefined  // Clear expiry để jose tự set
    })
}

/**
 * Validate session và trả về status
 * Không throw error, chỉ trả về boolean
 * @returns true nếu session hợp lệ, false nếu không
 */
export async function isAuthenticated(): Promise<boolean> {
    const userId = await getUserIdFromSession()
    return userId !== null
}

// Export type để sử dụng trong các components khác
export type { SessionPayload as SessionData }