// src/app/api/auth/signin/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as argon2 from 'argon2'
import * as bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

// Constants giống như trong session.ts
const ALG = 'HS256'
const COOKIE_NAME = 'session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Helper functions
function getSecretKey(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret || secret.length < 32) {
        console.warn('[signin] AUTH_SECRET missing or too short, using fallback')
        const fallback = 'dev-secret-key-min-32-characters-long-fallback'
        return new TextEncoder().encode(fallback)
    }
    return new TextEncoder().encode(secret)
}

async function signToken(userId: string, email?: string): Promise<string> {
    return await new SignJWT({
        uid: userId,
        email: email
    })
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime(`${MAX_AGE}s`)
        .sign(getSecretKey())
}

async function verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
        if (hash.startsWith('$argon2')) {
            return await argon2.verify(hash, plain)
        }
        if (hash.startsWith('$2')) {
            return await bcrypt.compare(plain, hash)
        }
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
        const body = await req.json()
        const email = body?.email?.trim()
        const password = body?.password

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            )
        }

        const emailLower = email.toLowerCase()

        // Find user
        const user = await prisma.user.findUnique({
            where: { emailLower },
            select: {
                id: true,
                email: true,
                emailLower: true,
                passwordHash: true,
                emailVerifiedAt: true,
                planTier: true
            }
        })

        if (!user || !user.passwordHash) {
            return NextResponse.json(
                { error: 'Email hoặc mật khẩu không đúng' },
                { status: 401 }
            )
        }

        // Verify password
        const isValid = await verifyPassword(user.passwordHash, password)
        if (!isValid) {
            return NextResponse.json(
                { error: 'Email hoặc mật khẩu không đúng' },
                { status: 401 }
            )
        }

        // Check email verification if required
        const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
        if (requireEmailVerification && !user.emailVerifiedAt) {
            return NextResponse.json(
                { error: 'Vui lòng xác thực email trước khi đăng nhập' },
                { status: 403 }
            )
        }

        // Create JWT token
        const token = await signToken(user.id, user.email || user.emailLower)

        console.log('[signin] Token created for user:', user.id)
        console.log('[signin] Token preview:', token.substring(0, 20) + '...')

        // Create response
        const response = NextResponse.json({
            ok: true,
            message: 'Đăng nhập thành công',
            redirectUrl: '/chat',
            user: {
                id: user.id,
                email: user.email || user.emailLower
            }
        })

        // QUAN TRỌNG: Set cookie trực tiếp với response.cookies.set()
        response.cookies.set({
            name: COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: MAX_AGE,
            path: '/'
        })

        console.log('[signin] Cookie set with name:', COOKIE_NAME)
        console.log('[signin] Success for user:', user.id)

        return response

    } catch (error: unknown) {
        const err = error as Error & { code?: string }
        console.error('[signin] Error:', err)

        return NextResponse.json(
            {
                error: 'Có lỗi xảy ra, vui lòng thử lại',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            },
            { status: 500 }
        )
    }
}