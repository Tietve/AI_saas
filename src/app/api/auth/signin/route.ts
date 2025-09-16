// src/app/api/auth/signin/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'  // Đổi từ @/lib/prisma
import { SignJWT } from 'jose'
import * as argon2 from 'argon2'
import * as bcrypt from 'bcryptjs'
import type { JWTPayload } from 'jose'

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 ngày
const ALG = 'HS256'

function getSecretKey(): Uint8Array {
    const sec = process.env.AUTH_SECRET || 'dev-secret-change'
    return new TextEncoder().encode(sec)
}

async function signSession(payload: { uid: string } & JWTPayload): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime(`${COOKIE_MAX_AGE}s`)
        .sign(getSecretKey())
}

// Verify password với auto-detect format
async function verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
        // Kiểm tra Argon2
        if (hash.startsWith('$argon2')) {
            return await argon2.verify(hash, plain)
        }
        // Kiểm tra bcrypt
        if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
            return await bcrypt.compare(plain, hash)
        }
        // Fallback: thử cả hai
        const argonResult = await argon2.verify(hash, plain).catch(() => false)
        if (argonResult) return true

        return await bcrypt.compare(plain, hash).catch(() => false)
    } catch (error) {
        console.error('[verifyPassword] Error:', error)
        return false
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}))
        const emailInput = String(body?.email ?? '').trim()
        const password = String(body?.password ?? '')

        // Validate input
        if (!emailInput || !password) {
            return NextResponse.json(
                { code: 'MISSING_CREDENTIALS', message: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            )
        }

        const emailLower = emailInput.toLowerCase()

        // Tìm user với cả 2 field để đảm bảo backward compatibility
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { emailLower },
                    { email: emailInput }
                ]
            },
            select: {
                id: true,
                passwordHash: true,
                emailVerifiedAt: true
            }
        })

        if (!user) {
            console.log(`[signin] User not found for: ${emailLower}`)
            return NextResponse.json(
                { code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng' },
                { status: 401 }
            )
        }

        // Kiểm tra email đã verify chưa (optional - tuỳ business logic)
        if (!user.emailVerifiedAt && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            return NextResponse.json(
                { code: 'EMAIL_NOT_VERIFIED', message: 'Vui lòng xác minh email trước khi đăng nhập' },
                { status: 403 }
            )
        }

        // Verify password
        const passwordValid = await verifyPassword(user.passwordHash, password)
        if (!passwordValid) {
            console.log(`[signin] Invalid password for user: ${user.id}`)
            return NextResponse.json(
                { code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng' },
                { status: 401 }
            )
        }

        // Tạo JWT session
        const token = await signSession({ uid: user.id })

        // Tạo response với cookie
        const res = NextResponse.json({
            ok: true,
            userId: user.id,
            message: 'Đăng nhập thành công'
        })

        res.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: COOKIE_MAX_AGE,
        })

        console.log(`[signin] Success for user: ${user.id}`)
        return res

    } catch (error) {
        console.error('[signin] Unexpected error:', error)
        return NextResponse.json(
            { code: 'INTERNAL', message: 'Có lỗi xảy ra, vui lòng thử lại' },
            { status: 500 }
        )
    }
}