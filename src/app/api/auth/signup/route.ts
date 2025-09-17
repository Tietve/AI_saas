// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as argon2 from 'argon2'
import { createSessionCookie } from '@/lib/auth/session'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const email = body?.email?.trim()
        const password = body?.password
        // Name field không tồn tại trong schema, bỏ qua

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
                { status: 400 }
            )
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Email không hợp lệ' },
                { status: 400 }
            )
        }

        // Convert to lowercase for unique check
        const emailLower = email.toLowerCase()

        // Check if user exists với emailLower
        const existingUser = await prisma.user.findUnique({
            where: { emailLower },
            select: { id: true }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email đã được sử dụng' },
                { status: 409 }
            )
        }

        // Hash password với Argon2
        const passwordHash = await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
        })

        // Create new user với emailLower (không có name field trong schema)
        const user = await prisma.user.create({
            data: {
                email: email,  // Keep original casing for display
                emailLower: emailLower,  // Lowercase for unique constraint
                passwordHash,
                // Mark as verified if not requiring email verification
                emailVerifiedAt: process.env.REQUIRE_EMAIL_VERIFICATION === 'false'
                    ? new Date()
                    : null,
                planTier: 'FREE',  // Default plan
                monthlyTokenUsed: 0
            },
            select: {
                id: true,
                email: true,
                emailLower: true,
                emailVerifiedAt: true,
                planTier: true,
                createdAt: true
            }
        })

        console.log('[signup] Created new user:', user.id)

        // Create session if email verification not required
        if (process.env.REQUIRE_EMAIL_VERIFICATION === 'false') {
            const cookieData = await createSessionCookie(user.id, {
                email: user.email || user.emailLower
            })

            const response = NextResponse.json({
                ok: true,
                message: 'Đăng ký thành công',
                redirectUrl: '/chat',
                user: {
                    id: user.id,
                    email: user.email || user.emailLower,
                    planTier: user.planTier
                }
            })

            // Set session cookie
            response.cookies.set(
                cookieData.name,
                cookieData.value,
                {
                    ...cookieData.options,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7
                }
            )

            return response
        } else {
            // TODO: Send verification email
            return NextResponse.json({
                ok: true,
                message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
                needsVerification: true,
                user: {
                    id: user.id,
                    email: user.email || user.emailLower,
                    planTier: user.planTier
                }
            })
        }

    } catch (error: unknown) {
        // Type-safe error handling
        const err = error as Error & { code?: string }
        console.error('[signup] Error:', err)

        // Handle specific Prisma errors
        if (err.code === 'P2002') {
            return NextResponse.json(
                { error: 'Email đã được sử dụng' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            {
                error: 'Có lỗi xảy ra khi đăng ký',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            },
            { status: 500 }
        )
    }
}