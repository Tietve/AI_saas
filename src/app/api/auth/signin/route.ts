// src/app/api/auth/signin/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { createSessionCookie } from '@/lib/auth/session'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const email = body?.email?.trim()
        const password = body?.password

        console.log('[signin] Attempt for:', email)

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
                passwordHash: true,
                emailVerifiedAt: true
            }
        })

        if (!user) {
            console.log('[signin] User not found:', emailLower)
            return NextResponse.json(
                { error: 'Email hoặc mật khẩu không đúng' },
                { status: 401 }
            )
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
            console.log('[signin] Invalid password for:', emailLower)
            return NextResponse.json(
                { error: 'Email hoặc mật khẩu không đúng' },
                { status: 401 }
            )
        }

        // Check email verification
        const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
        if (requireVerification && !user.emailVerifiedAt) {
            console.log('[signin] Email not verified for:', emailLower)
            return NextResponse.json(
                {
                    error: 'Vui lòng xác thực email trước khi đăng nhập',
                    needsVerification: true,
                    email: user.email
                },
                { status: 403 }
            )
        }

        // Create session
        const cookieData = await createSessionCookie(user.id, {
            email: user.email || emailLower
        })

        console.log('[signin] Success for:', user.id)

        const response = NextResponse.json({
            ok: true,
            message: 'Đăng nhập thành công',
            redirectUrl: '/chat'
        })

        // Set session cookie
        response.cookies.set(
            cookieData.name,
            cookieData.value,
            {
                httpOnly: true,
                secure: false, // false for localhost
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7
            }
        )

        return response

    } catch (error) {
        console.error('[signin] Error:', error)
        return NextResponse.json(
            { error: 'Có lỗi xảy ra' },
            { status: 500 }
        )
    }
}